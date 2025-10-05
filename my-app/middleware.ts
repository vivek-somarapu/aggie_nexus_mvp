import { type NextRequest, NextResponse } from 'next/server';
import { getServerAuthState } from './lib/auth-state';

// Enhanced logging for middleware
const middlewareLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[MIDDLEWARE ${timestamp}] ${message}`, data);
  } else {
    console.log(`[MIDDLEWARE ${timestamp}] ${message}`);
  }
};

const middlewareError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[MIDDLEWARE ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[MIDDLEWARE ERROR ${timestamp}] ${message}`);
  }
};

/**
 * Middleware function for handling authentication and protected routes
 * 
 * PHASE 4: Updated to use unified auth state management for consistency
 * between server and client components
 */
export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;
  
  middlewareLog("Processing request", { 
    path: currentPath, 
    method: request.method,
    userAgent: request.headers.get('user-agent')?.slice(0, 50) + '...'
  });

  // Initialize response to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    middlewareLog("Getting unified auth state");
    
    // Use unified auth state management
    const authState = await getServerAuthState();
    
    middlewareLog("Auth state retrieved", { 
      isAuthenticated: authState.isAuthenticated,
      userId: authState.user?.id,
      isEmailVerified: authState.isEmailVerified,
      hasProfile: !!authState.profile
    });
    
    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/auth/callback',
      '/auth/waiting',
      '/auth/reset-password',
      '/calendar', // Allow unauthenticated users to view calendar
      '/api/events', // Allow fetching events without auth
    ];

    // Check if current route is public or an API route
    const isPublicRoute = publicRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    const isApiRoute = currentPath.startsWith('/api/');
    
    middlewareLog("Route classification", { 
      currentPath, 
      isPublicRoute, 
      isApiRoute 
    });
    
    // Allow public routes and most API routes to proceed
    if (isPublicRoute || isApiRoute) {
      middlewareLog("Allowing public/API route");
      return response;
    }

    // For protected routes, check authentication
    if (!authState.isAuthenticated) {
      middlewareLog("User not authenticated, redirecting to login", { currentPath });
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', currentPath);
      return NextResponse.redirect(loginUrl);
    }
    
    // List of routes that require email verification
    const verificationRequiredRoutes = [
      '/profile',
      '/projects',
      '/users', 
      '/projects/new',
      '/projects/edit',
    ];
    
    // Check if route requires email verification
    const requiresVerification = verificationRequiredRoutes.some(route => 
      currentPath.startsWith(route)
    );
    
    middlewareLog("Verification check", { 
      requiresVerification, 
      isEmailVerified: authState.isEmailVerified 
    });
    
    // If email verification is required and user's email isn't verified
    if (requiresVerification && !authState.isEmailVerified) {
      middlewareLog("Email verification required, redirecting to waiting");
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
    
    middlewareLog("Auth route check", { isAuthRoute });
    
    // Redirect authenticated users away from auth pages
    if (isAuthRoute) {
      // If user is authenticated but email not verified, redirect to waiting page
      if (!authState.isEmailVerified) {
        middlewareLog("Authenticated user with unverified email accessing auth route, redirecting to waiting");
        return NextResponse.redirect(new URL('/auth/waiting', request.url));
      }
      // If user is fully verified, redirect to home
      middlewareLog("Authenticated user accessing auth route, redirecting to home");
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Add auth state headers for client-side consistency (optional)
    response.headers.set('X-Auth-State', JSON.stringify({
      isAuthenticated: authState.isAuthenticated,
      isEmailVerified: authState.isEmailVerified,
      userId: authState.user?.id,
      lastUpdated: authState.lastUpdated
    }));
    
    // For all responses, add cache control headers to prevent caching of dynamic content
    // This helps prevent issues with back-button navigation to protected pages after logout
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    middlewareLog("Request processing completed, allowing through");
  } catch (error) {
    // If there's an error with the auth check, log it but allow the request to continue
    middlewareError('Middleware auth error', error);
    
    // On error, default to allowing the request but add error header
    response.headers.set('X-Auth-Error', 'true');
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