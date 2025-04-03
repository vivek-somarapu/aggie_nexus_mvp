import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

// List of routes that require authentication
const protectedRoutes = [
  '/profile',
  '/projects/new',
  '/projects/edit',
  '/bookmarks',
];

// List of routes that should be redirected to home if already authenticated
const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// List of public routes that don't require authentication
const publicRoutes = [
  '/',
  '/projects',
  '/users',
  '/calendar',
];

// Skip middleware for callback route to avoid conflicts with client-side auth
const bypassMiddleware = [
  '/auth/callback',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth checks for specific routes to avoid conflicts
  if (bypassMiddleware.some(route => pathname.startsWith(route))) {
    console.log(`Middleware: Bypassing auth checks for ${pathname}`);
    return NextResponse.next();
  }
  
  // Create supabase client with response
  const { supabase, response } = createClient(request);
  
  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Log session state and errors for debugging
  if (sessionError) {
    console.error(`Middleware: Session error for ${pathname}:`, sessionError);
  }
  
  console.log(`Middleware: Path ${pathname}, Session ${session ? 'exists' : 'does not exist'}`);
  
  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isPublicRoute) {
    console.log(`Middleware: Allowing public route ${pathname}`);
    return response;
  }
  
  // Check if the path is a protected route and user is not authenticated
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    console.log(`Middleware: Redirecting unauthenticated user from ${pathname} to login`);
    // Redirect unauthenticated users to login
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', encodeURIComponent(pathname));
    return NextResponse.redirect(redirectUrl);
  }
  
  // Check if the path is an auth route and user is authenticated
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isAuthRoute && session) {
    console.log(`Middleware: Redirecting authenticated user from ${pathname} to home`);
    // Redirect authenticated users to home
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 