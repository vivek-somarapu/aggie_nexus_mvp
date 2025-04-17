import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log("Auth callback triggered with URL:", request.url)
  console.log("Code parameter present:", !!code)
  
  // If no code provided, redirect to home
  if (!code) {
    console.error("Auth callback - missing code parameter")
    return NextResponse.redirect(new URL('/auth/login?error=Missing+verification+code', requestUrl.origin))
  }

  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  // Exchange the code for a session
  try {
    console.log("Attempting to exchange code for session")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error.message)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
    
    console.log("Successfully exchanged code for session, user logged in:", !!data.session)
    
    // Redirect to waiting page to check authentication and profile status
    return NextResponse.redirect(new URL('/auth/waiting', requestUrl.origin))
  } catch (err) {
    console.error("Unexpected error in auth callback:", err)
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication+failed', requestUrl.origin)
    )
  }
} 