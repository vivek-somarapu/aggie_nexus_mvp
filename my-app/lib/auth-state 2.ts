/**
 * Unified Auth State Management (Phase 4)
 * 
 * This module provides centralized auth state management to prevent conflicts
 * between middleware, server components, and client components.
 * 
 * Key Features:
 * - Single source of truth for auth state
 * - Consistent session validation across server and client
 * - Automatic state synchronization
 * - Race condition prevention
 */

import { createClient as createServerClient } from './supabase/server';
import { createClient as createBrowserClient } from './supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from './auth';

// Enhanced logging for auth state management
const stateLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[AUTH STATE ${timestamp}] ${message}`, data);
  } else {
    console.log(`[AUTH STATE ${timestamp}] ${message}`);
  }
};

const stateError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[AUTH STATE ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[AUTH STATE ERROR ${timestamp}] ${message}`);
  }
};

/**
 * Standardized auth state interface
 * Used consistently across server and client
 */
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  lastUpdated: string;
}

/**
 * Server-side auth state retrieval
 * Used by middleware and server components
 */
export async function getServerAuthState(): Promise<AuthState> {
  stateLog("Getting server-side auth state");
  
  try {
    const supabase = await createServerClient();
    
    // Get user and session separately for proper typing
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (userError || sessionError) {
      stateError("Server auth state error", { userError, sessionError });
      return createEmptyAuthState();
    }
    
    if (!user || !session) {
      stateLog("No authenticated user found on server");
      return createEmptyAuthState();
    }
    
    stateLog("Server auth state retrieved", {
      userId: user.id,
      hasSession: !!session,
      isEmailVerified: !!user.email_confirmed_at
    });
    
    // Get profile data if user is authenticated
    let profile: Profile | null = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('deleted', false)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        stateError("Error fetching profile in server auth state", profileError);
      } else if (profileData) {
        profile = profileData as Profile;
        stateLog("Profile loaded in server auth state", {
          hasProfile: true,
          profileId: profile.id
        });
      }
    } catch (profileErr) {
      stateError("Exception fetching profile in server auth state", profileErr);
    }
    
    return {
      user,
      profile,
      session,
      isAuthenticated: true,
      isEmailVerified: !!user.email_confirmed_at,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (err) {
    stateError("Exception in getServerAuthState", err);
    return createEmptyAuthState();
  }
}

/**
 * Client-side auth state retrieval
 * Used by React components
 */
export async function getClientAuthState(): Promise<AuthState> {
  stateLog("Getting client-side auth state");
  
  try {
    const supabase = createBrowserClient();
    
    // Add timeout protection to prevent hanging during tab switches
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('getClientAuthState timeout after 5 seconds'));
      }, 5000);
    });
    
    // Get user and session separately for proper typing with timeout protection
    const authPromise = Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession()
    ]);
    
    const [userResult, sessionResult] = await Promise.race([
      authPromise,
      timeoutPromise
    ]);
    
    const { data: { user }, error: userError } = userResult;
    const { data: { session }, error: sessionError } = sessionResult;
    
    if (userError || sessionError) {
      stateError("Client auth state error", { userError, sessionError });
      return createEmptyAuthState();
    }
    
    if (!user || !session) {
      stateLog("No authenticated user found on client");
      return createEmptyAuthState();
    }
    
    stateLog("Client auth state retrieved", {
      userId: user.id,
      hasSession: !!session,
      isEmailVerified: !!user.email_confirmed_at
    });
    
    // Get profile data if user is authenticated (with timeout protection)
    let profile: Profile | null = null;
    try {
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('deleted', false)
        .single();
      
      const profileTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Profile fetch timeout after 3 seconds'));
        }, 3000);
      });
      
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        profileTimeoutPromise
      ]);
        
      if (profileError && profileError.code !== 'PGRST116') {
        stateError("Error fetching profile in client auth state", profileError);
      } else if (profileData) {
        profile = profileData as Profile;
        stateLog("Profile loaded in client auth state", {
          hasProfile: true,
          profileId: profile.id
        });
      }
    } catch (profileErr) {
      stateError("Exception fetching profile in client auth state", profileErr);
    }
    
    return {
      user,
      profile,
      session,
      isAuthenticated: true,
      isEmailVerified: !!user.email_confirmed_at,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (err) {
    stateError("Exception in getClientAuthState", err);
    return createEmptyAuthState();
  }
}

/**
 * Validate session consistency between server and client
 * Helps detect and resolve state synchronization issues
 */
export function validateSessionConsistency(
  serverState: AuthState, 
  clientState: AuthState
): { isConsistent: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check user ID consistency
  if (serverState.user?.id !== clientState.user?.id) {
    issues.push(`User ID mismatch: server=${serverState.user?.id}, client=${clientState.user?.id}`);
  }
  
  // Check authentication status consistency
  if (serverState.isAuthenticated !== clientState.isAuthenticated) {
    issues.push(`Auth status mismatch: server=${serverState.isAuthenticated}, client=${clientState.isAuthenticated}`);
  }
  
  // Check email verification consistency
  if (serverState.isEmailVerified !== clientState.isEmailVerified) {
    issues.push(`Email verification mismatch: server=${serverState.isEmailVerified}, client=${clientState.isEmailVerified}`);
  }
  
  // Check profile consistency
  if (serverState.profile?.id !== clientState.profile?.id) {
    issues.push(`Profile ID mismatch: server=${serverState.profile?.id}, client=${clientState.profile?.id}`);
  }
  
  const isConsistent = issues.length === 0;
  
  if (!isConsistent) {
    stateError("Session consistency validation failed", { issues });
  } else {
    stateLog("Session consistency validation passed");
  }
  
  return { isConsistent, issues };
}

/**
 * Create empty auth state for unauthenticated users
 */
function createEmptyAuthState(): AuthState {
  return {
    user: null,
    profile: null,
    session: null,
    isAuthenticated: false,
    isEmailVerified: false,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Update profile in database with optimistic updates
 * Ensures consistent state across all components
 */
export async function updateProfileState(
  userId: string, 
  updates: Partial<Profile>,
  isServer: boolean = false
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  stateLog("Updating profile state", { 
    userId, 
    updateKeys: Object.keys(updates),
    isServer 
  });
  
  try {
    const supabase = isServer ? await createServerClient() : createBrowserClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      stateError("Profile update failed", error);
      return { success: false, error: error.message };
    }
    
    stateLog("Profile updated successfully", { profileId: data.id });
    return { success: true, profile: data as Profile };
    
  } catch (err) {
    stateError("Exception updating profile state", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Clear auth state across all systems
 * Used during logout to ensure clean state
 */
export async function clearAuthState(isServer: boolean = false): Promise<void> {
  stateLog("Clearing auth state", { isServer });
  
  try {
    const supabase = isServer ? await createServerClient() : createBrowserClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      stateError("Error during auth state clear", error);
    } else {
      stateLog("Auth state cleared successfully");
    }
    
    // Clear client-side storage if on client
    if (!isServer && typeof window !== 'undefined') {
      // Clear localStorage auth items
      const authKeys = [
        'lastSignupEmail',
        'emailVerified', 
        'awaitingVerification',
        'supabase.auth.token'
      ];
      
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });
      
      stateLog("Client-side auth storage cleared");
    }
    
  } catch (err) {
    stateError("Exception clearing auth state", err);
  }
} 