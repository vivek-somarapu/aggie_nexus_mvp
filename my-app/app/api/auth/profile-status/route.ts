import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API endpoint to check if user needs to complete their profile
 * Used by client components to determine redirects after authentication
 */
export async function GET() {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error in profile status:', sessionError);
      return NextResponse.json(
        { error: 'Authentication error', details: sessionError.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Check user profile for completeness
    const { data, error } = await supabase
      .from('users')
      .select('bio, skills')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { shouldSetupProfile: true, error: error.message },
        { status: 200 }
      );
    }
    
    // Check if profile needs setup (missing bio or skills)
    const shouldSetupProfile = !data || !data.bio || !data.skills || data.skills.length === 0;
    
    return NextResponse.json(
      { shouldSetupProfile, userId },
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