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
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')

  if (provider !== 'google' && provider !== 'github') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const supabase = await createClient()

  // Build the public-facing origin from headers rather than request.url.
  //
  // On Render (and most reverse-proxy deployments), request.url contains the
  // INTERNAL process URL (e.g. https://localhost:10000) because the proxy
  // forwards the request to the local process port. Using that as the OAuth
  // redirectTo would send users back to localhost instead of the real domain.
  //
  // The `host` header always carries the public hostname (Render forwards it
  // faithfully). `x-forwarded-proto` carries the original protocol (https in
  // production). Together they give the correct public origin.
  const host = request.headers.get('host') ?? ''
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? 'https'
  const publicOrigin = `${proto}://${host}`

  // For accelerator requests, prefer ACCEL_URL so the callback always lands on
  // accelerator.aggiex.org even if Supabase's Site URL points elsewhere.
  // On localhost the host is never 'accelerator.*', so ACCEL_URL is never used
  // there even if set in .env.local.
  const isAcceleratorHost = host.includes('accelerator')
  const redirectBase = isAcceleratorHost && process.env.ACCEL_URL
    ? process.env.ACCEL_URL
    : publicOrigin
  const redirectTo = `${redirectBase}/auth/callback`

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
