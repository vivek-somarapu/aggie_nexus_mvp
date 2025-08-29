"use client";

// Auth Context and Provider for Next.js with Supabase
// ---------------------------------------------
// This module exports:
// 1. `AuthUser`  - minimal auth user info from Supabase Auth (id, email)
// 2. `Profile`   - extended user profile stored in your own `users` table
// 3. `AuthProvider` & `useAuth` hook for accessing both

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";
import {
  User as SupabaseUser,
  Session,
  AuthError,
  User,
} from "@supabase/supabase-js";
import { getClientAuthState, clearAuthState, type AuthState } from "./auth-state-client";

// Enhanced logging utility
const authLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[AUTH ${timestamp}] ${message}`, data);
  } else {
    console.log(`[AUTH ${timestamp}] ${message}`);
  }
};

const authError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[AUTH ERROR ${timestamp}] ${message}`, error);
  } else {
    console.error(`[AUTH ERROR ${timestamp}] ${message}`);
  }
};

/**
 * Minimal authenticated user info from Supabase Auth
 */
export type AuthUser = {
  id: string;
  email: string;
};

/**
 * Extended profile fetched from the `users` table
 */
export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string | null;
  resume_url?: string | null;
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  industry?: string[];
  skills?: string[];
  organizations?: string[];
// New fields for orgnanization affiliations and verifications
  organization_claims?: Array<{
    organization: string;
    claimed_at: string;
    verification_method?: string;
    status: 'pending' | 'verified' | 'rejected';
  }>;
  organization_verifications?: Record<string, {
    verified_at: string;
    verified_by: string;
    verification_method: string;
    notes?: string;
  }>;

  graduation_year?: number;
  is_texas_am_affiliate?: boolean;
  contact?: {
    email?: string;
    phone?: string;
  };
  profile_setup_skipped?: boolean;
  profile_setup_completed?: boolean;
  profile_setup_skipped_at?: string;
  last_login_at?: string;
  role?: string;
  additional_links?: { url: string; title: string }[];
};

// Define auth context type
type AuthContextType = {
  authUser: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthReady: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithGitHub: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  role: string;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  isLoading: true,
  isAuthReady: false,
  error: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  signInWithGoogle: async () => false,
  signInWithGitHub: async () => false,
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
  role: 'user',
});

/**
 * Fetch user profile from database with enhanced logging
 * @param userId User ID to fetch profile for
 * @returns User profile or null if not found
 */
async function fetchUserProfile(userId: string): Promise<Profile | null> {
  authLog("fetchUserProfile: Starting profile fetch", { userId });
  const supabase = createClient();

  try {
    // Fetch from users table
    authLog("fetchUserProfile: Querying users table");
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("deleted", false)
      .single();

    if (error) {
      authError("fetchUserProfile: Database error", { error: error.message, code: error.code });
      
      // If user not found, create a fallback profile
      if (error.code === 'PGRST116') {
        authLog("fetchUserProfile: User not found in database, creating fallback profile");
        return {
          id: userId,
          full_name: "User",
          email: "",
          bio: "",
          skills: [],
          industry: [],
        };
      }
      
      // For other errors, return fallback profile to prevent blocking
      authError("fetchUserProfile: Returning fallback profile due to error");
      return {
        id: userId,
        full_name: "User",
        email: "",
        bio: "",
        skills: [],
        industry: [],
      };
    }

    authLog("fetchUserProfile: Profile fetch successful", { 
      hasProfile: !!data,
      profileId: data?.id,
      hasName: !!data?.full_name,
      hasBio: !!data?.bio,
      skillsCount: data?.skills?.length || 0
    });
    return data as Profile;
  } catch (err) {
    authError("fetchUserProfile: Exception during profile fetch", err);
    // Return fallback profile to prevent complete failure
    return {
      id: userId,
      full_name: "User",
      email: "",
      bio: "",
      skills: [],
      industry: [],
    };
  }
}

/**
 * Map Supabase Auth user to our minimal `AuthUser` type
 */
function mapSupabaseUser(s: SupabaseUser): AuthUser {
  return { id: s.id, email: s.email ?? "" };
}

/**
 * AuthProvider component that manages authentication state
 * PHASE 4: Enhanced with unified auth state management
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const initializationRef = useRef(false);
  const router = useRouter();

  // Stable auth ready state - only becomes true after initial auth check
  // and remains true even during background sync operations
  const isAuthReady = isInitialized;

  /**
   * Initialize auth state using unified auth state management
   */
  useEffect(() => {
    authLog("useEffect: Auth initialization triggered (Phase 4)", { 
      isInitialized, 
      initializationRefCurrent: initializationRef.current,
      isLoading 
    });

    // Skip if already initialized or initialization in progress
    if (isInitialized || initializationRef.current) {
      authLog("useEffect: Already initialized or initialization in progress, skipping");
      return;
    }

    initializationRef.current = true;
    const supabase = createClient();
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        authLog("useEffect: Timeout reached, forcing loading state to false");
        setIsLoading(false);
      }
    }, 8000);

    // Initialize using unified auth state
    authLog("useEffect: Getting unified client auth state");
    getClientAuthState()
      .then(async (clientAuthState) => {
        clearTimeout(timeoutId);
        authLog("useEffect: Unified auth state retrieved", { 
          isAuthenticated: clientAuthState.isAuthenticated,
          userId: clientAuthState.user?.id,
          isEmailVerified: clientAuthState.isEmailVerified,
          hasProfile: !!clientAuthState.profile
        });

        // Update local state from unified auth state
        setAuthState(clientAuthState);
        
        if (clientAuthState.isAuthenticated && clientAuthState.user) {
          setAuthUser(mapSupabaseUser(clientAuthState.user));
          setProfile(clientAuthState.profile);
        } else {
          setAuthUser(null);
          setProfile(null);
        }

        // Setup auth state change listener
        authLog("useEffect: Setting up auth state change listener");
        authListener = supabase.auth.onAuthStateChange(
          async (event: string, session: Session | null) => {
            authLog("Auth state change event received", { 
              event, 
              hasSession: !!session,
              userId: session?.user?.id 
            });
            
            setError(null);

            if (event === "SIGNED_OUT") {
              authLog("Auth state change: User signed out");
              setAuthUser(null);
              setProfile(null);
              setAuthState(null);
              return;
            }

            if (session) {
              authLog("Auth state change: Session exists, updating auth user");
              
              // Get fresh unified auth state for consistency
              try {
                const freshAuthState = await getClientAuthState();
                setAuthState(freshAuthState);
                
                if (freshAuthState.isAuthenticated && freshAuthState.user) {
                  setAuthUser(mapSupabaseUser(freshAuthState.user));
                  
                  // Only fetch profile for certain events to prevent loops
                  if (event === "SIGNED_IN" || event === "USER_UPDATED") {
                    authLog("Auth state change: Updating profile for event", event);
                    setProfile(freshAuthState.profile);
                  }
                } else {
                  authLog("Auth state change: Fresh auth state shows not authenticated");
                  setAuthUser(null);
                  setProfile(null);
                }
              } catch (err) {
                authError("Auth state change: Error getting fresh auth state", err);
                // Fallback to basic session handling
                setAuthUser(mapSupabaseUser(session.user));
              }
            } else {
              authLog("Auth state change: No session, clearing auth state");
              setAuthUser(null);
              setProfile(null);
              setAuthState(null);
            }
          }
        );

        authLog("useEffect: Auth initialization completed");
        setIsInitialized(true);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        clearTimeout(timeoutId);
        authError("useEffect: Error during unified auth state initialization", err);
        setError("Authentication initialization failed");
        setIsLoading(false);
        setIsInitialized(true);
      });

    // Clean up
    return () => {
      authLog("useEffect: Cleaning up auth initialization");
      clearTimeout(timeoutId);
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
      initializationRef.current = false;
    };
  }, [isInitialized]); // Depend on isInitialized so it can re-run when reset

  /**
   * Tab visibility handler to reset auth state when tab becomes active
   * This ensures auth re-initializes after tab switching
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        authLog("Tab became active, checking auth state health");
        
        // If we're in a loading state or have no auth user but should be authenticated,
        // reset initialization to allow re-initialization
        if (isLoading || (!authUser && initializationRef.current)) {
          authLog("Resetting auth initialization due to tab visibility change");
          initializationRef.current = false;
          setIsLoading(true);
          setIsInitialized(false);
          
          // Trigger re-initialization by updating a dependency
          setError(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isInitialized, isLoading, authUser]); // Dependencies to track auth state

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    authLog("signIn: Starting sign in process", { email });
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      authLog("signIn: Calling signInWithPassword");
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        authError("signIn: Authentication failed", error);
        setError(error.message);
        return false;
      }

      if (!data.user) {
        authError("signIn: No user returned from authentication");
        setError("Login failed - no user data received");
        return false;
      }

      authLog("signIn: Authentication successful", { 
        userId: data.user.id,
        isEmailConfirmed: !!data.user.email_confirmed_at 
      });

      // Check if user's email is verified
      if (!data.user.email_confirmed_at) {
        authLog("signIn: Email not verified, handling unverified user flow");
        
        // Store the email for the waiting page
        localStorage.setItem("lastSignupEmail", email);
        
        // Send verification email
        try {
          authLog("signIn: Sending verification email");
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          
          if (resendError) {
            authError("signIn: Error sending verification email", resendError);
          } else {
            authLog("signIn: Verification email sent successfully");
          }
        } catch (resendErr) {
          authError("signIn: Failed to send verification email", resendErr);
        }
        
        // Set the auth user so they can access the waiting page
        setAuthUser(mapSupabaseUser(data.user));
        
        // Redirect to waiting page
        authLog("signIn: Redirecting to waiting page");
        router.push("/auth/waiting");
        return true;
      }

      // Fetch user profile after successful sign-in (for verified users)
      authLog("signIn: Email verified, fetching user profile");
      setAuthUser(mapSupabaseUser(data.user));
      
      const userProfile = await fetchUserProfile(data.user.id);
      setProfile(userProfile);

      // Redirect based on the fetched profile's completeness
      if (
        !userProfile ||
        !userProfile.bio ||
        !userProfile.skills ||
        userProfile.skills.length === 0
      ) {
        authLog("signIn: Profile incomplete, redirecting to setup");
        router.push("/profile/setup");
      } else {
        authLog("signIn: Profile complete, redirecting to home");
        router.push("/");
      }

      return true;
    } catch (err: any) {
      authError("signIn: Exception during sign in", err);
      setError(err.message || "Failed to sign in");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    authLog("signUp: Starting sign up process", { email, fullName });
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      authLog("signUp: Calling signUp");
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (error) {
        authError("signUp: Sign up failed", error);
        setError(error.message);
        return false;
      }

      authLog("signUp: Sign up successful", { 
        hasUser: !!data.user,
        userId: data.user?.id 
      });

      // If we have user data, set it
      if (data.user) {
        setAuthUser(mapSupabaseUser(data.user));
      }

      return true;
    } catch (err: any) {
      authError("signUp: Exception during sign up", err);
      setError(err.message || "Failed to sign up");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   * PHASE 4: Enhanced with unified auth state clearing
   */
  const signOut = async () => {
    authLog("signOut: Starting sign out process (Phase 4)", { 
      hasAuthUser: !!authUser,
      userId: authUser?.id 
    });
    try {
      setIsLoading(true);
      setError(null);

      // Use unified auth state clearing
      authLog("signOut: Calling unified clearAuthState()");
      await clearAuthState(); // Client-side only, no parameters

      authLog("signOut: Sign out successful, clearing local auth state");
      // Clear local auth state immediately to prevent flash of protected content
      setAuthUser(null);
      setProfile(null);
      setAuthState(null);

      // Redirect to landing page
      authLog("signOut: Redirecting to home page");
      router.push("/");
    } catch (err: any) {
      authError("signOut: Exception during sign out", err);
      
      // Even if signOut fails, clear local state to prevent inconsistency
      authLog("signOut: Clearing local state despite error");
      setAuthUser(null);
      setProfile(null);
      setAuthState(null);
      
      setError(err.message || "Failed to sign out");
      
      // Still redirect to prevent user from being stuck
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
    authLog("signInWithGoogle: Starting Google OAuth flow");
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        authError("signInWithGoogle: OAuth failed", error);
        setError(error.message);
        return false;
      }

      authLog("signInWithGoogle: OAuth initiated successfully");
      return true;
    } catch (err: any) {
      authError("signInWithGoogle: Exception during Google OAuth", err);
      setError(err.message || "Failed to sign in with Google");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with GitHub OAuth
   */
  const signInWithGitHub = async () => {
    authLog("signInWithGitHub: Starting GitHub OAuth flow");
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        authError("signInWithGitHub: OAuth failed", error);
        setError(error.message);
        return false;
      }

      authLog("signInWithGitHub: OAuth initiated successfully");
      return true;
    } catch (err: any) {
      authError("signInWithGitHub: Exception during GitHub OAuth", err);
      setError(err.message || "Failed to sign in with GitHub");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request a password reset email
   */
  const requestPasswordReset = async (email: string) => {
    authLog("requestPasswordReset: Starting password reset", { email });
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        authError("requestPasswordReset: Password reset failed", error);
        setError(error.message);
      } else {
        authLog("requestPasswordReset: Password reset email sent successfully");
      }
    } catch (err: any) {
      authError("requestPasswordReset: Exception during password reset", err);
      setError(err.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password with new password
   */
  const resetPassword = async (newPassword: string) => {
    authLog("resetPassword: Starting password reset");
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        authError("resetPassword: Password update failed", error);
        setError(error.message);
      } else {
        authLog("resetPassword: Password updated successfully");
        router.push("/auth/login?reset=success");
      }
    } catch (err: any) {
      authError("resetPassword: Exception during password reset", err);
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manually refresh user profile data from the database
   */
  const refreshProfile = async () => {
    authLog("refreshProfile: Starting profile refresh", { 
      hasAuthUser: !!authUser,
      userId: authUser?.id 
    });
    
    if (!authUser) {
      authLog("refreshProfile: No auth user, skipping refresh");
      return;
    }

    try {
      setIsLoading(true);
      const userProfile = await fetchUserProfile(authUser.id);
      authLog("refreshProfile: Profile refresh completed", { 
        hasProfile: !!userProfile 
      });
      setProfile(userProfile);
    } catch (err) {
      authError("refreshProfile: Error refreshing profile", err);
      setError("Failed to refresh profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Create context value
  const value: AuthContextType = {
    authUser,
    profile,
    isLoading,
    isAuthReady,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    requestPasswordReset,
    resetPassword,
    refreshProfile,
    role: profile?.role || 'user',
  };

  authLog("AuthProvider: Rendering with state", {
    hasAuthUser: !!authUser,
    hasProfile: !!profile,
    isLoading,
    hasError: !!error,
    isInitialized
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 */
export const useAuth = () => useContext(AuthContext);
