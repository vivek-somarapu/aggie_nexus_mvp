"use client";

// Auth Context and Provider for Next.js with Supabase
// ---------------------------------------------
// This module exports:
// 1. `AuthUser`  - minimal auth user info from Supabase Auth (id, email)
// 2. `Profile`   - extended user profile stored in your own `users` table
// 3. `AuthProvider` & `useAuth` hook for accessing both

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";
import {
  User as SupabaseUser,
  Session,
  AuthError,
  User,
} from "@supabase/supabase-js";

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
  is_manager?: boolean;
  additional_links?: { url: string; title: string }[];
};

// Define auth context type
type AuthContextType = {
  authUser: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
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
  isManager: boolean;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  isLoading: true,
  error: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  signInWithGoogle: async () => false,
  signInWithGitHub: async () => false,
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
  isManager: false,
});

/**
 * Fetch user profile from database
 * @param userId User ID to fetch profile for
 * @returns User profile or null if not found
 */
async function fetchUserProfile(userId: string): Promise<Profile | null> {
  console.log("AUTH: Fetching profile start");
  const supabase = createClient();

  try {
    // Fetch from users table
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("deleted", false)
      .single();

    if (error) {
      console.error("AUTH ERROR: Error fetching user profile:", error);
      // Don't get stuck - return empty profile as fallback
      return {
        id: userId,
        full_name: "User",
        email: "",
        bio: "",
        skills: [],
        industry: [],
      };
    }

    console.log("AUTH: Profile fetch success");
    return data as Profile;
  } catch (err) {
    console.error("AUTH ERROR: Exception fetching profile:", err);
    // Return fallback profile
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
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  /**
   * Initialize auth state and set up auth state change listener
   */
  useEffect(() => {
    console.log("AUTH: Starting auth initialization");

    // Prevent multiple initializations during development with Fast Refresh
    if (isInitialized) return;

    const supabase = createClient();
    let authListener: { data: { subscription: { unsubscribe: () => void } } };

    // Timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("AUTH: Timeout reached, forcing loading state to false");
        setIsLoading(false);
      }
    }, 5000);

    // Initialize: Get current user (secure)
    supabase.auth
      .getUser()
      .then(
        async ({ data: { user } }: { data: { user: SupabaseUser | null } }) => {
          clearTimeout(timeoutId);
          console.log("AUTH: User check complete", !!user);

          if (user) {
            setAuthUser(mapSupabaseUser(user));
            try {
              console.log("AUTH: Fetching user profile for", user.id);
              const userProfile = await fetchUserProfile(user.id);
              console.log("AUTH: Profile fetch result", !!userProfile);
              setProfile(userProfile);
            } catch (err) {
              console.error("AUTH: Error during initial profile fetch", err);
            }
          }

          // Setup listener after initial session check
          authListener = supabase.auth.onAuthStateChange(
            async (event: string, session: Session | null) => {
              setError(null);

              console.log("AUTH: Auth state change event:", event);

              if (event === "SIGNED_OUT") {
                setAuthUser(null);
                setProfile(null);
                return;
              }

              if (session) {
                setAuthUser(mapSupabaseUser(session.user));

                // Only fetch profile for certain events
                if (
                  ["SIGNED_IN", "USER_UPDATED", "TOKEN_REFRESHED"].includes(
                    event
                  )
                ) {
                  try {
                    const userProfile = await fetchUserProfile(session.user.id);
                    setProfile(userProfile);
                  } catch (err) {
                    console.error(
                      "AUTH: Error fetching profile on auth change",
                      err
                    );
                  }
                }
              }
            }
          );

          setIsInitialized(true);
          setIsLoading(false);
        }
      )
      .catch((err: Error) => {
        console.error("AUTH: Error during initialization", err);
        setIsLoading(false);
        setIsInitialized(true);
      });

    // Clean up
    return () => {
      clearTimeout(timeoutId);
      if (authListener) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return false;
      }

      // Fetch user profile after successful sign-in
      if (data.user) {
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
          router.push("/profile/setup");
        } else {
          router.push("/");
        }
      }

      // No user returned is unexpected but handle gracefully
      if (!data.user) {
        router.push("/");
      }

      return true;
    } catch (err: any) {
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
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
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
        setError(error.message);
        return false;
      }

      // Don't try to insert into users table directly after signup
      // Supabase auth handles the user creation in auth.users
      // Any profile data will be set when the user completes their profile
      // or we can use a database webhook to automatically create profiles

      // If we need the user information immediately after signup,
      // we should simply set the state with the data we have
      if (data.user) {
        setAuthUser(mapSupabaseUser(data.user));
      }

      // Return true to indicate successful signup
      // The user will need to verify their email before they can use full functionality
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      setIsLoading(true);

      const supabase = createClient();
      // Sign out and clear any session data from browser
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message || "Failed to sign out");
        return;
      }

      // Clear auth state immediately to prevent flash of protected content
      setAuthUser(null);
      setProfile(null);

      // Redirect to landing page instead of login
      router.push("/");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const signInWithGoogle = async () => {
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
        setError(error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("AUTH: Error during Google OAuth sign-in", err);
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
        setError(error.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error("AUTH: Error during GitHub OAuth sign-in", err);
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
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password with new password
   */
  const resetPassword = async (newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/auth/login?reset=success");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Manually refresh user profile data from the database,
   * in case something changed — like after the user updates their
   * profile (name, bio, avatar, etc.), or after an external update.
   */
  const refreshProfile = async () => {
    if (!authUser) return;

    try {
      setIsLoading(true);
      const userProfile = await fetchUserProfile(authUser.id);
      setProfile(userProfile);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create context value
  const value: AuthContextType = {
    authUser,
    profile,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    requestPasswordReset,
    resetPassword,
    refreshProfile,
    isManager: profile?.is_manager === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 */
export const useAuth = () => useContext(AuthContext);
