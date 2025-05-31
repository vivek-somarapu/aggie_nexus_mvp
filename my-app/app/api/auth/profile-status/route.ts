import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

/**
 * API endpoint to check if user needs to complete their profile
 * Used by client components to determine redirects after authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Get the just_logged_in parameter from the request
    const { searchParams } = new URL(request.url);
    const justLoggedInParam = searchParams.get('just_logged_in');
    // Convert to boolean (string 'true' becomes true, anything else is false)
    const justLoggedIn = justLoggedInParam === 'true';
    
    const supabase = createClient();
    
    // Check if user is authenticated (secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User verification error in profile status:', userError);
      return NextResponse.json(
        { error: 'Authentication error', details: userError.message },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user ID from verified user
    const userId = user.id;
    
    // Check user profile for completeness and skip preference
    const { data, error } = await supabase
      .from('users')
      .select('bio, skills, profile_setup_skipped, profile_setup_completed, last_login_at, profile_setup_skipped_at')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { shouldSetupProfile: true, error: error.message },
        { status: 200 }
      );
    }
    
    // Check if user has explicitly completed their profile
    if (data?.profile_setup_completed) {
      return NextResponse.json(
        { 
          shouldSetupProfile: false, 
          userId,
          hasSkippedSetup: false,
          hasCompletedSetup: true
        },
        { status: 200 }
      );
    }
    
    // Check if profile needs setup:
    // If the user has explicitly skipped setup and it's not a new login session,
    // don't prompt them again
    if (data?.profile_setup_skipped) {
      // Use the just_logged_in parameter from the client
      // This is more reliable than checking timestamps server-side
      return NextResponse.json(
        { 
          shouldSetupProfile: justLoggedIn, // Only show if just logged in
          userId,
          hasSkippedSetup: true,
          hasCompletedSetup: false
        },
        { status: 200 }
      );
    }
    
    // Otherwise, check if they have sufficient profile data
    const hasRequiredProfileData = !!(data?.bio && data?.skills && data?.skills.length > 0);
    
    // If the profile is incomplete, we should show the setup page
    const shouldSetupProfile = !hasRequiredProfileData;
    
    return NextResponse.json(
      { 
        shouldSetupProfile,
        userId,
        hasSkippedSetup: false,
        hasCompletedSetup: hasRequiredProfileData
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in profile status check:', err);
    return NextResponse.json(
      { error: 'Internal server error', shouldSetupProfile: true },
      { status: 200 } // Return 200 with shouldSetupProfile flag even on error
    );
  }
} 