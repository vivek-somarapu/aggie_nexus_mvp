/**
 * Client-Side Auth State Management (Phase 4)
 * 
 * This module provides client-side auth state management functions
 * separated from server-side functions to avoid build issues.
 */

import { createClient } from './supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from './auth';

// Enhanced logging for auth state management
const stateLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[CLIENT AUTH STATE ${timestamp}] ${message}`, data);
  } else {
    console.log(`[CLIENT AUTH STATE ${timestamp}] ${message}`);
  }
};

const stateError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[CLIENT AUTH STATE ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[CLIENT AUTH STATE ERROR ${timestamp}] ${message}`);
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
 * Client-side auth state retrieval
 * Used by React components
 */
export async function getClientAuthState(): Promise<AuthState> {
  stateLog("Getting client-side auth state");
  
  try {
    const supabase = createClient();
    
    // Get user and session separately for proper typing
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (userError) {
      stateError("Client user auth error", { 
        message: userError.message,
        status: userError.status,
        name: userError.name
      });
      return createEmptyAuthState();
    }
    
    if (sessionError) {
      stateError("Client session auth error", { 
        message: sessionError.message,
        status: sessionError.status,
        name: sessionError.name
      });
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
        stateError("Error fetching profile in client auth state", {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
      } else if (profileData) {
        profile = profileData as Profile;
        stateLog("Profile loaded in client auth state", {
          hasProfile: true,
          profileId: profile.id
        });
      } else {
        stateLog("No profile found for authenticated user");
      }
    } catch (profileErr) {
      stateError("Exception fetching profile in client auth state", {
        message: profileErr instanceof Error ? profileErr.message : 'Unknown error',
        stack: profileErr instanceof Error ? profileErr.stack : undefined,
        name: profileErr instanceof Error ? profileErr.name : 'Unknown'
      });
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
    stateError("Exception in getClientAuthState", {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : 'Unknown',
      type: typeof err
    });
    return createEmptyAuthState();
  }
}

/**
 * Update profile in database with optimistic updates
 * Ensures consistent state across all components
 */
export async function updateProfileState(
  userId: string, 
  updates: Partial<Profile>
): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  stateLog("Updating profile state", { 
    userId, 
    updateKeys: Object.keys(updates)
  });
  
  try {
    const supabase = createClient();
    
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
export async function clearAuthState(): Promise<void> {
  stateLog("Clearing client auth state");
  
  try {
    const supabase = createClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      stateError("Error during auth state clear", error);
    } else {
      stateLog("Auth state cleared successfully");
    }
    
    // Clear client-side storage
    if (typeof window !== 'undefined') {
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