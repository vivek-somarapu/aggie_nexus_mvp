import type { NextRequest } from 'next/server';

// Edge Runtime (default). No next/server classes are imported at runtime —
// only native Response/Headers/URL — so no __dirname or process.versions
// references are bundled. The middleware-manifest.json is populated correctly
// for Vercel's CDN routing (Node.js runtime breaks this by writing to
// functions-config-manifest.json instead, which Vercel's edge layer ignores).

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/waiting',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/calendar',
  '/api/events',
  '/privacy',
  '/terms',
  '/eggs',
  '/accelerator/access-denied',
];

function hasAuthCookie(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie') ?? '';
  return cookieHeader.split(';').some((part) => {
    const name = part.trim().split('=')[0].trim();
    // @supabase/ssr splits long JWTs into chunked cookies:
    //   sb-<ref>-auth-token        (short token, fits in one cookie)
    //   sb-<ref>-auth-token.0      (chunk 0)
    //   sb-<ref>-auth-token.1      (chunk 1)  …etc.
    // Using includes() catches both forms.
    return name.startsWith('sb-') && name.includes('-auth-token');
  });
}

// Equivalent to NextResponse.next() — tells Next.js to continue to the route handler.
function continueResponse(extraHeaders?: Record<string, string>): Response {
  const headers = new Headers(extraHeaders);
  headers.set('x-middleware-next', '1');
  return new Response(null, { headers });
}

// Equivalent to NextResponse.redirect() with a 302.
function redirectTo(url: URL): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}

export function middleware(request: NextRequest) {
  const currentPath = new URL(request.url).pathname;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );

  if (isPublicRoute || currentPath.startsWith('/api/')) {
    return continueResponse();
  }

  if (!hasAuthCookie(request)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', currentPath);
    return redirectTo(loginUrl);
  }

  const isAuthRoute =
    currentPath.startsWith('/auth/login') || currentPath.startsWith('/auth/signup');

  if (isAuthRoute) {
    return redirectTo(new URL('/', request.url));
  }

  return continueResponse({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webpo)$).*)',
  ],
};
