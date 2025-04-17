import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Regular client with anon key for client-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get the signed-in user's data bypassing RLS
export async function fetchUserProfile(userId: string): Promise<any> {
  // Try the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('deleted', false)
    .single();
    
  if (!userError && userData) {
    return userData;
  }
  
  // If not found or error, try profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (!profileError && profileData) {
    return profileData;
  }
  
  // If still not found, try getting the minimal user info from auth.users
  // (this is a fallback option)
  
  try {
    // This only works if the user is requesting their own profile
    const { data: authUser } = await supabase.auth.getUser();
    
    if (authUser && authUser.user && authUser.user.id === userId) {
      // Create a minimal profile from auth data
      return {
        id: userId,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.full_name || authUser.user.email || 'User',
        industry: [],
        skills: [],
        contact: { email: authUser.user.email || '' },
        views: 0,
        is_texas_am_affiliate: false,
      };
    }
  } catch (err) {
    console.error('Error fetching auth user:', err);
  }
  
  // Return null if all attempts fail
  return null;
} 