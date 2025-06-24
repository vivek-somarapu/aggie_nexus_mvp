import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Enhanced logging for Supabase client
const clientLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[SUPABASE CLIENT ${timestamp}] ${message}`, data);
  } else {
    console.log(`[SUPABASE CLIENT ${timestamp}] ${message}`);
  }
};

const clientError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[SUPABASE CLIENT ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[SUPABASE CLIENT ERROR ${timestamp}] ${message}`);
  }
};

// Create a singleton browser client to prevent multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let clientCreatedAt: number = 0;
let isTabActive: boolean = true;

// Track tab visibility to detect when client might be corrupted
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const wasActive = isTabActive;
    isTabActive = !document.hidden;
    
    // If tab becomes active after being hidden, mark client as potentially stale
    if (!wasActive && isTabActive && browserClient) {
      clientLog("Tab became active, checking client health");
      
      // If client is older than 30 seconds and tab was inactive, recreate it
      const clientAge = Date.now() - clientCreatedAt;
      if (clientAge > 30000) {
        clientLog("Client potentially stale after tab switch, will recreate on next use");
        browserClient = null;
      }
    }
  });
}

/**
 * Creates a Supabase client for use in browser environments.
 * Uses the SSR-compatible createBrowserClient for better integration with Next.js.
 * Implements singleton pattern to prevent multiple client instances while maintaining
 * proper auth state management.
 */
export function createClient() {
  // Check if we need to recreate the client due to potential corruption
  const needsRecreation = !browserClient || 
    (!isTabActive && (Date.now() - clientCreatedAt) > 60000); // Recreate if tab inactive for 1+ min
  
  if (needsRecreation) {
    if (browserClient) {
      clientLog("Recreating potentially corrupted Supabase client");
    } else {
      clientLog("Creating new Supabase browser client");
    }
    
    try {
      browserClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      clientCreatedAt = Date.now();
      
      // Add auth state change listener for debugging and session management
      browserClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        clientLog("Auth state change in client", { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          isEmailConfirmed: !!session?.user?.email_confirmed_at,
          timestamp: new Date().toISOString()
        });
        
        // Handle session cleanup on sign out
        if (event === 'SIGNED_OUT') {
          clientLog("User signed out, clearing client-side storage");
          clearClientSideAuthData();
        }
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED') {
          clientLog("Auth token refreshed successfully");
        }
        
        // Handle session errors
        if (event === 'SIGNED_IN' && session?.user) {
          clientLog("User signed in successfully", {
            userId: session.user.id,
            email: session.user.email,
            isEmailConfirmed: !!session.user.email_confirmed_at
          });
        }
      });
      
      clientLog("Supabase browser client created successfully");
    } catch (error) {
      clientError("Failed to create Supabase browser client", error);
      throw error;
    }
  } else {
    clientLog("Reusing existing Supabase browser client");
  }
  
  return browserClient;
}

/**
 * Clear client-side authentication data
 * Removes localStorage items and other client-side auth artifacts
 */
export function clearClientSideAuthData() {
  clientLog("Clearing client-side auth data");
  
  try {
    // Clear common auth-related localStorage items
    const authKeys = [
      'lastSignupEmail',
      'emailVerified',
      'awaitingVerification',
      'supabase.auth.token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    authKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        clientLog("Removing localStorage item", { key });
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage items
    const sessionKeys = [
      'awaitingVerification',
      'supabase.auth.token'
    ];
    
    sessionKeys.forEach(key => {
      if (sessionStorage.getItem(key)) {
        clientLog("Removing sessionStorage item", { key });
        sessionStorage.removeItem(key);
      }
    });
    
    clientLog("Client-side auth data cleared successfully");
  } catch (error) {
    clientError("Failed to clear client-side auth data", error);
  }
}

/**
 * Enhanced sign out function with comprehensive cleanup
 * Ensures complete session termination on both client and server
 */
export async function signOutWithCleanup() {
  clientLog("Starting enhanced sign out with cleanup");
  
  try {
    const client = createClient();
    
    // First, sign out from Supabase
    const { error } = await client.auth.signOut();
    
    if (error) {
      clientError("Supabase sign out failed", error);
      throw error;
    }
    
    clientLog("Supabase sign out successful");
    
    // Clear client-side data
    clearClientSideAuthData();
    
    // Force refresh the client instance to ensure clean state
    browserClient = null;
    
    clientLog("Enhanced sign out completed successfully");
    return true;
  } catch (error) {
    clientError("Enhanced sign out failed", error);
    throw error;
  }
}

/**
 * Get current session with enhanced error handling
 * Provides detailed logging for debugging session issues
 */
export async function getCurrentSession() {
  clientLog("Getting current session");
  
  try {
    const client = createClient();
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      clientError("Failed to get current session", error);
      return { session: null, error };
    }
    
    clientLog("Current session retrieved", {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      isEmailConfirmed: !!data.session?.user?.email_confirmed_at,
      expiresAt: data.session?.expires_at
    });
    
    return { session: data.session, error: null };
  } catch (error) {
    clientError("Exception getting current session", error);
    return { session: null, error };
  }
}

/**
 * Refresh session with retry logic
 * Handles token refresh with proper error handling and logging
 */
export async function refreshSession(retries = 1) {
  clientLog("Refreshing session", { retries });
  
  try {
    const client = createClient();
    const { data, error } = await client.auth.refreshSession();
    
    if (error) {
      clientError("Session refresh failed", error);
      
      // Retry logic for network issues
      if (retries > 0 && (error.message.includes('network') || error.message.includes('timeout'))) {
        clientLog("Retrying session refresh", { retriesLeft: retries - 1 });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return refreshSession(retries - 1);
      }
      
      return { session: null, error };
    }
    
    clientLog("Session refreshed successfully", {
      hasSession: !!data.session,
      userId: data.session?.user?.id,
      isEmailConfirmed: !!data.session?.user?.email_confirmed_at
    });
    
    return { session: data.session, error: null };
  } catch (error) {
    clientError("Exception refreshing session", error);
    return { session: null, error };
  }
}

/**
 * Force refresh the client instance (useful for debugging)
 */
export function refreshClient() {
  clientLog("Forcing refresh of Supabase client");
  browserClient = null;
  return createClient();
} 