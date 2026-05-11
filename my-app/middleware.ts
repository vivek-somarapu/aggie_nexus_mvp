import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  // Middleware must create its own Supabase client using request/response cookies
  // because next/headers cookies() is not available in the Edge Runtime.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthenticated = !!user;
  const isEmailVerified = !!user?.email_confirmed_at;

  const publicRoutes = [
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

  const isPublicRoute = publicRoutes.some(
    (route) => currentPath === route || currentPath.startsWith(route + '/')
  );
  const isApiRoute = currentPath.startsWith('/api/');

  if (isPublicRoute || isApiRoute) {
    return response;
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', currentPath);
    return NextResponse.redirect(loginUrl);
  }

  const verificationRequiredRoutes = [
    '/profile',
    '/projects',
    '/users',
    '/projects/new',
    '/projects/edit',
  ];

  const requiresVerification = verificationRequiredRoutes.some((route) =>
    currentPath.startsWith(route)
  );

  if (requiresVerification && !isEmailVerified) {
    return NextResponse.redirect(new URL('/auth/waiting', request.url));
  }

  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.some((route) => currentPath.startsWith(route));

  if (isAuthRoute) {
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL('/auth/waiting', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
