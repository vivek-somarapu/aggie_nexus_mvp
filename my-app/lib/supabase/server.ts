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
            // Removed verbose logging for every cookie read
            return value;
          },
          set(name: string, value: string, options: CookieOptions = {}) {
            serverLog("Cookie set", { name });
            try {
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                // Ensure secure defaults for auth cookies
                httpOnly: options.httpOnly ?? true,
                secure: options.secure ?? process.env.NODE_ENV === 'production',
                sameSite: options.sameSite ?? 'lax',
                path: options.path ?? '/'
              });
            } catch (error) {
              serverError("Failed to set cookie", { name, error });
            }
          },
          remove(name: string, options: CookieOptions = {}) {
            serverLog("Cookie remove", { name });
            try {
              cookieStore.set({ 
                name, 
                value: '', 
                ...options,
                expires: new Date(0),
                maxAge: 0,
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