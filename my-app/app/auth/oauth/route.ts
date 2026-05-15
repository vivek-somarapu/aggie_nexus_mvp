import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Server-side OAuth initiation route.
//
// Why server-side instead of client-side signInWithOAuth?
// The PKCE code verifier must live in the same cookie scope as the callback
// that reads it. When the browser initiates OAuth, it stores the verifier in
// its own cookie jar scoped to the current domain. If Supabase then redirects
// to a different domain (e.g. www.aggiex.org instead of accelerator.aggiex.org),
// the verifier is not found → "PKCE code verifier not found" error.
//
// When the server initiates OAuth, createServerClient writes the verifier via
// Next.js's cookie store, which honours SHARED_COOKIE_DOMAIN (= .aggiex.org in
// production). The verifier is then accessible from all *.aggiex.org subdomains,
// regardless of which domain the callback lands on.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get('provider')

  if (provider !== 'google' && provider !== 'github') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const supabase = await createClient()

  // Always send accelerator OAuth back to the accelerator domain.
  // For the main site, fall back to the request origin so www.aggiex.org
  // OAuth stays on www.aggiex.org.
  const host = request.headers.get('host') ?? ''
  const isAccelerator = host.includes('accelerator') || !!process.env.ACCEL_URL
  const redirectTo = isAccelerator
    ? `${process.env.ACCEL_URL ?? origin}/auth/callback`
    : `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error?.message ?? 'OAuth failed')}`, request.url)
    )
  }

  return NextResponse.redirect(data.url)
}
