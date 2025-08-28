import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { profileSetupStatus } from '@/lib/profile-utils';

/**
 * API endpoint to check if user needs to complete their profile
 * Used by client components to determine redirects after authentication
 * 
 * SIMPLIFIED (Phase 3): Removed complex timing logic and just_logged_in parameter
 * that was causing infinite loops. Now uses consistent profile status determination.
 */
export async function GET(request: NextRequest) {
  const profileLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[PROFILE STATUS API ${timestamp}] ${message}`, data);
    } else {
      console.log(`[PROFILE STATUS API ${timestamp}] ${message}`);
    }
  };

  const profileError = (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[PROFILE STATUS API ERROR ${timestamp}] ${message}`, error);
    } else {
      console.error(`[PROFILE STATUS API ERROR ${timestamp}] ${message}`);
    }
  };

  try {
    profileLog("Profile status check initiated");
    
    const supabase = await createClient();
    
    // Check if user is authenticated (secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      profileError('User verification error in profile status', userError);
      return NextResponse.json(
        { error: 'Authentication error', details: userError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      profileLog("No authenticated user found");
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    profileLog("Authenticated user found", { userId: user.id });
    
    // Get user profile for completeness check
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      profileError('Error fetching user profile', error);
      return NextResponse.json(
        { shouldSetupProfile: true, error: error.message },
        { status: 200 }
      );
    }
    
    if (!data) {
      profileLog("No profile found in database, setup needed");
      return NextResponse.json(
        { 
          shouldSetupProfile: true, 
          userId: user.id,
          hasSkippedSetup: false,
          hasCompletedSetup: false
        },
        { status: 200 }
      );
    }
    
    // Use simplified profile status logic
    const status = profileSetupStatus(data);
    
    profileLog("Profile status determined", {
      userId: user.id,
      shouldSetupProfile: status.shouldSetupProfile,
      hasSkippedSetup: status.hasSkippedSetup,
      hasCompletedSetup: status.hasCompletedSetup,
      hasFullName: !!data.full_name,
      hasBio: !!data.bio,
      hasSkills: !!(data.skills && data.skills.length > 0),
      profileSetupCompleted: data.profile_setup_completed,
      profileSetupSkipped: data.profile_setup_skipped
    });
    
    // If profile has required data but isn't marked as completed, 
    // update it to completed to prevent future prompts
    if (!status.shouldSetupProfile && !data.profile_setup_completed && !data.profile_setup_skipped) {
      profileLog("Auto-marking profile as completed for legacy user");
      try {
        await supabase
          .from('users')
          .update({ profile_setup_completed: true })
          .eq('id', user.id);
        profileLog("Profile auto-marked as completed");
      } catch (updateError) {
        profileError("Failed to auto-mark profile as completed", updateError);
        // Continue anyway - this is not critical
      }
    }
    
    return NextResponse.json(
      { 
        shouldSetupProfile: status.shouldSetupProfile,
        userId: user.id,
        hasSkippedSetup: status.hasSkippedSetup,
        hasCompletedSetup: status.hasCompletedSetup
      },
      { status: 200 }
    );
  } catch (err) {
    profileError('Error in profile status check', err);
    return NextResponse.json(
      { error: 'Internal server error', shouldSetupProfile: true },
      { status: 200 } // Return 200 with shouldSetupProfile flag even on error
    );
  }
} 