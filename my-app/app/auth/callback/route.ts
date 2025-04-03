import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/';
  
  console.log('Auth callback triggered:', { hasCode: !!code });
  
  if (code) {
    try {
      console.log('Exchanging auth code for session');
      const cookieStore = cookies();
      const supabase = await createClient(cookieStore);
      
      // Exchange the auth code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${requestUrl.origin}?auth_error=${encodeURIComponent(error.message)}`);
      }
      
      if (data.session) {
        console.log('Session established successfully');
        
        // Check if we need to create a new user profile
        if (data.user && data.user.app_metadata.provider !== 'email') {
          // For OAuth providers, we might need to create a user profile
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (!existingUser) {
            console.log('Creating new user profile for OAuth user');
            // Create a user profile for this OAuth user
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata.full_name || data.user.email?.split('@')[0] || 'User',
              contact: { email: data.user.email }
            });
          }
        }
        
        // Add cache-busting query param to ensure the page reloads with the new auth state
        const timestamp = new Date().getTime();
        return NextResponse.redirect(`${requestUrl.origin}${redirectTo}?auth_success=true&t=${timestamp}`);
      }
    } catch (error) {
      console.error('Unexpected error in auth callback:', error);
      return NextResponse.redirect(`${requestUrl.origin}?auth_error=unexpected_error`);
    }
  }

  // If no code or other issues, redirect to home
  console.log('No auth code found, redirecting to home');
  return NextResponse.redirect(requestUrl.origin);
} 