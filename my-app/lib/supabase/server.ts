import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Reduced logging for server client operations
const serverLog = (message: string, data?: any) => {
  // Only log important operations, not every cookie read
  if (message.includes('Creating') || message.includes('ERROR') || message.includes('remove')) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[SUPABASE SERVER ${timestamp}] ${message}`, data);
    } else {
      console.log(`[SUPABASE SERVER ${timestamp}] ${message}`);
    }
  }
};

const serverError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[SUPABASE SERVER ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[SUPABASE SERVER ERROR ${timestamp}] ${message}`);
  }
};

// Share auth cookies across all *.aggiex.org subdomains in production so
// that a session established on aggiex.org works on accelerator.aggiex.org
// and vice-versa. Guarded by NODE_ENV rather than ACCEL_URL because ACCEL_URL
// is also present in .env.local, which would cause browsers to reject
// Set-Cookie with Domain=.aggiex.org on localhost (different eTLD+1).
const SHARED_COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.aggiex.org' : undefined;

/**
 * Creates a Supabase client for server-side operations.
 * Optimized to reduce excessive cookie operations.
 */
export async function createClient() {
  serverLog("Creating server-side Supabase client");

  try {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            return value;
          },
          set(name: string, value: string, options: CookieOptions = {}) {
            serverLog("Cookie set", { name });
            try {
              // PKCE code-verifier cookies must use SameSite=None so Safari stores
              // them when the Set-Cookie arrives on the same response that immediately
              // redirects cross-site to Google. Safari drops SameSite=Lax cookies in
              // that scenario; Chrome does not. Without None, Safari falls back to a
              // stale verifier → "code challenge does not match previously saved code
              // verifier". Session/auth cookies keep SameSite=Lax (CSRF protection).
              const isPkceVerifier = name.includes('code-verifier')
              cookieStore.set({
                name,
                value,
                ...options,
                domain: SHARED_COOKIE_DOMAIN,
                httpOnly: options.httpOnly ?? true,
                secure: true,
                sameSite: isPkceVerifier ? 'none' : (options.sameSite ?? 'lax'),
                path: options.path ?? '/'
              });
            } catch (error) {
              serverError("Failed to set cookie", { name, error });
            }
          },
          remove(name: string, options: CookieOptions = {}) {
            serverLog("Cookie remove", { name });
            try {
              const isPkceVerifier = name.includes('code-verifier')
              cookieStore.set({
                name,
                value: '',
                ...options,
                domain: SHARED_COOKIE_DOMAIN,
                expires: new Date(0),
                maxAge: 0,
                secure: true,
                sameSite: isPkceVerifier ? 'none' : (options.sameSite ?? 'lax'),
                path: options.path ?? '/'
              });
            } catch (error) {
              serverError("Failed to remove cookie", { name, error });
            }
          },
        },
      }
    );
  } catch (error) {
    serverError("Failed to create server client", error);
    throw error;
  }
}

/**
 * Enhanced session cleanup utility for server-side logout operations
 */
export async function clearAuthCookies() {
  serverLog("Clearing all auth cookies");
  
  try {
    const cookieStore = await cookies();
    
    // Clear all Supabase auth cookies including fragments
    const authCookiePatterns = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-provider-token',
      'sb-provider-refresh-token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
    ];
    
    const allCookies = cookieStore.getAll();
    
    for (const cookie of allCookies) {
      // Remove cookies that match Supabase patterns or are auth token fragments
      if (authCookiePatterns.some(pattern => cookie.name.includes(pattern)) || 
          cookie.name.startsWith('sb-') ||
          cookie.name.includes('-auth-token')) {
        serverLog("Removing auth cookie", { name: cookie.name });
        
        cookieStore.set({
          name: cookie.name,
          value: '',
          expires: new Date(0),
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    }
    
    serverLog("Auth cookies cleared successfully");
  } catch (error) {
    serverError("Failed to clear auth cookies", error);
    throw error;
  }
} 