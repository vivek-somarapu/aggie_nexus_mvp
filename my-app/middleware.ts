import { type NextRequest, NextResponse } from 'next/server';

// Middleware only does fast cookie-presence routing.
// Full auth verification (getUser, session validation) happens in server components
// where Node.js APIs are available. The Edge Runtime cannot run the Supabase SDK
// because @supabase/realtime-js uses process.versions, a Node.js-only API.

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
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );
}

export function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );
  const isApiRoute = currentPath.startsWith('/api/');

  if (isPublicRoute || isApiRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!hasAuthCookie(request)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', currentPath);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  const isAuthRoute =
    currentPath.startsWith('/auth/login') || currentPath.startsWith('/auth/signup');

  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webpo)$).*)',
  ],
};
