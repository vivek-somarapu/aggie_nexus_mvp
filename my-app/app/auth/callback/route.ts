import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback handler for OAuth and email verification redirects
 * Processes Supabase authentication code to establish a session
 */
export async function GET(request: NextRequest) {
  // Get the authorization code from the URL
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // If no code provided, redirect to home page
  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  try {
    const supabase = createClient()
    
    // Exchange the code for a session 
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Auth callback error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    // Retrieve the new session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Auth callback error:', userError)
      return NextResponse.redirect(`${requestUrl.origin}/?auth_error=callback_failed`)
    }
    
    // After OAuth login, we need to check if the user has a complete profile
    // and perform any necessary data operations
    try {
      // Check if the user exists in the users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, bio, skills, profile_setup_skipped, profile_setup_completed')
        .eq('id', user.id)
        .single()
        
      if (userError && userError.code !== 'PGRST116') {
        // Log the error but continue - we'll create a user if needed
        console.error('Error checking existing user:', userError)
      }
        
      // Update the last login timestamp ALWAYS when a user logs in
      // This is critical for the "just logged in" detection
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString() 
        })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating last login time:', updateError);
      }

      // If the user exists, check if the profile is complete
      if (existingUser) {
        // If the user has explicitly completed their profile, go to home page
        if (existingUser.profile_setup_completed) {
          return NextResponse.redirect(new URL('/', requestUrl.origin))
        }
        
        // If the user previously skipped setup, but it's a new login session,
        // give them another chance to complete their profile
        if (existingUser.profile_setup_skipped) {
          // But only if they haven't completed the minimum profile requirements
          if (!existingUser.bio || !existingUser.skills || existingUser.skills.length === 0) {
            return NextResponse.redirect(new URL('/profile/setup', requestUrl.origin))
          }
          return NextResponse.redirect(new URL('/', requestUrl.origin))
        }
        
        // If bio or skills are missing and user hasn't explicitly skipped,
        // redirect to profile setup
        if (!existingUser.bio || !existingUser.skills || existingUser.skills.length === 0) {
          return NextResponse.redirect(new URL('/profile/setup', requestUrl.origin))
        }
        
        // If profile has all required fields but isn't explicitly marked as completed,
        // mark it as completed now
        if (!existingUser.profile_setup_completed) {
          const { error: completeError } = await supabase
            .from('users')
            .update({ profile_setup_completed: true })
            .eq('id', user.id);
            
          if (completeError) {
            console.error('Error marking profile as completed:', completeError);
          }
        }
        
        // If profile is complete, redirect to home page
        return NextResponse.redirect(new URL('/', requestUrl.origin))
      } else {
        // The user doesn't exist in the users table yet, we'll need to create them
        // Get user data from the session
        const { full_name, email } = user.user_metadata || {}
        const userEmail = email || user.email || ''
        
        // Create a new user entry
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
          console.error('Error creating user record:', insertError)
        }
        
        // Redirect to profile setup to complete the profile
        return NextResponse.redirect(new URL('/profile/setup', requestUrl.origin))
      }
    } catch (err) {
      console.error('Error in user profile check:', err)
      // On error, default to redirecting to the home page
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  } catch (err) {
    console.error('Auth callback exception:', err)
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication+failed', requestUrl.origin)
    )
  }
} 