import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware function for handling authentication and protected routes
 */
export async function middleware(request: NextRequest) {
  // Initialize response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client for auth operations with proper error handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // This is used to set cookies in the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          // This is used to remove cookies in the response
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  try {
    // Get the session and user authentication status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get the current path
    const currentPath = request.nextUrl.pathname;
    
    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/auth/callback',
      '/auth/waiting',
      '/auth/reset-password',
      '/projects', // Allow unauthenticated users to view projects
      '/users', // Allow unauthenticated users to view users  
      '/calendar', // Allow unauthenticated users to view calendar
      '/api/events', // Allow fetching events without auth
    ];

    // Check if current route is public or an API route
    const isPublicRoute = publicRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    const isApiRoute = currentPath.startsWith('/api/');
    
    // Allow public routes and most API routes to proceed
    if (isPublicRoute || isApiRoute) {
      return response;
    }

    // For protected routes, check authentication
    if (!user) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', currentPath);
      return NextResponse.redirect(loginUrl);
    }
    
    // List of routes that require email verification
    const verificationRequiredRoutes = [
      '/profile',
      '/projects/new',
      '/projects/edit',
    ];
    
    // Check if route requires email verification
    const requiresVerification = verificationRequiredRoutes.some(route => 
      currentPath.startsWith(route)
    );
    
    // If email verification is required and user's email isn't verified
    if (requiresVerification && user && !user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/auth/waiting', request.url));
    }
    
    // List of routes that should redirect to home if already authenticated
    const authRoutes = [
      '/auth/login',
      '/auth/signup',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    
    // Check if the user is already authenticated but trying to access auth routes
    const isAuthRoute = authRoutes.some(route => 
      currentPath.startsWith(route)
    );
    
    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
      // If user is authenticated but email not verified, redirect to waiting page
      if (!user.email_confirmed_at) {
        return NextResponse.redirect(new URL('/auth/waiting', request.url));
      }
      // If user is fully verified, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // For all responses, add cache control headers to prevent caching of dynamic content
    // This helps prevent issues with back-button navigation to protected pages after logout
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } catch (error) {
    // If there's an error with the auth check, log it but allow the request to continue
    console.error('Middleware auth error:', error);
  }
  
  // Allow the request to proceed with the potentially modified response
  return response;
}

export const config = {
  matcher: [
    // Match routes that require authentication checks but exclude static assets
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 