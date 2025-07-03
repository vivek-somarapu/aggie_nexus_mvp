import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { profileSetupStatus } from '@/lib/profile-utils'

// Enhanced logging for auth callback
const callbackLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[AUTH CALLBACK ${timestamp}] ${message}`, data);
  } else {
    console.log(`[AUTH CALLBACK ${timestamp}] ${message}`);
  }
};

const callbackError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[AUTH CALLBACK ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[AUTH CALLBACK ERROR ${timestamp}] ${message}`);
  }
};

/**
 * Auth callback handler for OAuth and email verification redirects
 * Processes Supabase authentication code to establish a session
 * 
 * UPDATED (Phase 3): Uses simplified profile status logic to prevent loops
 */
export async function GET(request: NextRequest) {
  // Get the authorization code from the URL
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  callbackLog("Auth callback initiated", { 
    hasCode: !!code, 
    origin: requestUrl.origin 
  });
  
  // If no code provided, redirect to home page
  if (!code) {
    callbackLog("No auth code provided, redirecting to home");
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  try {
    const supabase = await createClient()
    
    callbackLog("Exchanging code for session");
    // Exchange the code for a session 
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      callbackError("Code exchange failed", exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    callbackLog("Code exchange successful, retrieving user session");
    // Retrieve the new session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      callbackError("Failed to retrieve user after code exchange", userError);
      return NextResponse.redirect(`${requestUrl.origin}/?auth_error=callback_failed`)
    }
    
    callbackLog("User session established", {
      userId: user.id,
      email: user.email,
      isEmailConfirmed: !!user.email_confirmed_at
    });
    
    // After OAuth login, check/create user profile and determine redirect
    try {
      // Check if the user exists in the users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (userError && userError.code !== 'PGRST116') {
        // Log the error but continue - we'll create a user if needed
        callbackError("Error checking existing user", userError);
      }
        
      // Update the last login timestamp ALWAYS when a user logs in
      callbackLog("Updating last login timestamp");
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString() 
        })
        .eq('id', user.id);
        
      if (updateError) {
        callbackError("Failed to update last login time", updateError);
      } else {
        callbackLog("Last login timestamp updated successfully");
      }

      // If the user exists, use simplified profile status logic
      if (existingUser) {
        callbackLog("Existing user found, checking profile status");
        
        const status = profileSetupStatus(existingUser);
        
        callbackLog("Profile status determined", {
          shouldSetupProfile: status.shouldSetupProfile,
          hasSkippedSetup: status.hasSkippedSetup,
          hasCompletedSetup: status.hasCompletedSetup
        });
        
        // If profile is complete but not marked as such, mark it now
        if (status.hasCompletedSetup && !existingUser.profile_setup_completed) {
          callbackLog("Marking profile as completed");
          const { error: completeError } = await supabase
            .from('users')
            .update({ profile_setup_completed: true })
            .eq('id', user.id);
            
          if (completeError) {
            callbackError("Failed to mark profile as completed", completeError);
          } else {
            callbackLog("Profile marked as completed successfully");
          }
        }
        
        // Redirect based on profile status
        if (status.shouldSetupProfile) {
          callbackLog("Profile setup needed, redirecting to setup");
          return NextResponse.redirect(new URL('/profile/setup', requestUrl.origin))
        } else {
          callbackLog("Profile complete, redirecting to home");
          return NextResponse.redirect(new URL('/', requestUrl.origin))
        }
      } else {
        // The user doesn't exist in the users table yet, create them
        const { full_name, email } = user.user_metadata || {}
        const userEmail = email || user.email || ''
        
        callbackLog("Creating new user record", {
          fullName: full_name,
          email: userEmail
        });
        
        // Create a new user entry with clear setup flags
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            full_name: full_name || userEmail.split('@')[0] || 'New User',
            email: userEmail,
            industry: [],
            skills: [],
            contact: { email: userEmail },
            views: 0,
            is_texas_am_affiliate: false,
            deleted: false,
            last_login_at: new Date().toISOString(),
            profile_setup_completed: false,
            profile_setup_skipped: false
          })
          
        if (insertError) {
          callbackError("Failed to create user record", insertError);
        } else {
          callbackLog("New user record created successfully");
        }
        
        // New users always need to complete profile setup
        callbackLog("New user created, redirecting to profile setup");
        return NextResponse.redirect(new URL('/profile/setup', requestUrl.origin))
      }
    } catch (err) {
      callbackError("Error in user profile check", err);
      // On error, default to redirecting to the home page
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  } catch (err) {
    callbackError("Auth callback exception", err);
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication+failed', requestUrl.origin)
    )
  }
} 