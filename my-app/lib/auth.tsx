"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { fetchUserProfile } from './supabase-client';

// Define a simplified User type for auth purposes
export type User = {
  id: string;
  full_name: string;
  email: string;
  bio?: string;
  industry?: string[];
  skills?: string[];
  linkedin_url?: string;
  website_url?: string;
  resume_url?: string;
  additional_links?: Array<{ title: string; url: string }>;
  contact?: { email: string; phone?: string };
  views?: number;
  graduation_year?: number;
  is_texas_am_affiliate?: boolean;
  avatar?: string;
};

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithGitHub: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => false,
  logout: async () => {},
  signup: async () => false,
  signIn: async () => false,
  signUp: async () => false,
  signInWithGoogle: async () => false,
  signInWithGitHub: async () => false,
  requestPasswordReset: async () => {},
  resetPassword: async () => {},
});

// Initialize Supabase client using createBrowserClient
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('FATAL: Missing Supabase environment variables');
  // Consider throwing an error or handling this more gracefully
}

// Use createBrowserClient for the client-side instance
const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseAnonKey!
);

// Create a provider component that will wrap the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for user session on mount and listen for auth changes
  useEffect(() => {
    console.log('AuthProvider: useEffect initializing...');
    setIsLoading(true); // Start in loading state

    const getUserData = async (userId: string): Promise<User | null> => {
      console.log(`AuthProvider: Attempting to fetch profile for user ID: ${userId}`);
      
      const MAX_RETRIES = 2;
      const RETRY_DELAY = 1000; // milliseconds
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`AuthProvider: Attempt ${attempt + 1} to fetch profile for user ID: ${userId}`);
          
          // Use our new function to fetch user profile
          const profileData = await fetchUserProfile(userId);
          
          if (profileData) {
            console.log(`AuthProvider: Profile data successfully fetched for user ${userId}.`);
            
            // Fill in missing fields with empty/default values to ensure type safety
            const fullUser: User = {
              ...profileData,
              id: userId,
              email: profileData.email || '',
              full_name: profileData.full_name || 'User',
              bio: profileData.bio || undefined,
              industry: Array.isArray(profileData.industry) ? profileData.industry : [],
              skills: Array.isArray(profileData.skills) ? profileData.skills : [],
              linkedin_url: profileData.linkedin_url || undefined,
              website_url: profileData.website_url || undefined,
              resume_url: profileData.resume_url || undefined,
              additional_links: Array.isArray(profileData.additional_links) ? profileData.additional_links : [],
              contact: profileData.contact || { email: profileData.email || '' },
              views: profileData.views || 0,
              is_texas_am_affiliate: !!profileData.is_texas_am_affiliate,
              graduation_year: profileData.graduation_year || undefined,
              avatar: profileData.avatar || undefined
            };
            
            return fullUser;
          } else {
            console.warn(`AuthProvider: Attempt ${attempt + 1} - No profile data found for user ${userId}`);
            
            if (attempt < MAX_RETRIES) {
              console.log(`AuthProvider: Waiting ${RETRY_DELAY}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
          }
        } catch (err: any) {
          console.error(`AuthProvider: Attempt ${attempt + 1} - Error fetching profile for user ${userId}:`, 
            err.message || err);
            
          if (attempt < MAX_RETRIES) {
            console.log(`AuthProvider: Waiting ${RETRY_DELAY}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      
      // If we reached this point, all attempts failed
      console.error(`AuthProvider: Final attempt failed. Could not fetch profile for ${userId}. Creating minimal user object.`);
      
      // Return minimal user instead of null to ensure UI works even with database issues
      return {
        id: userId,
        email: '',
        full_name: 'User',
        industry: [],
        skills: [],
        contact: { email: '' },
        views: 0,
        is_texas_am_affiliate: false,
      } as User;
    };
    
    console.log("AuthProvider: Setting up onAuthStateChange listener...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthProvider: onAuthStateChange event: ${event}, Session: ${session ? 'Exists' : 'Null'}`);
        
        // Clear previous errors immediately
        setError(null); 
        
        // Handle SIGNED_OUT event explicitly and immediately 
        if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: SIGNED_OUT event detected - clearing user state');
          setUser(null);
          setIsLoading(false);
          
          // Clear any local Supabase tokens
          window.localStorage.clear();
          window.sessionStorage.clear();
          
          return; // Exit early to prevent any profile fetches
        }
        
        // If user is already set to null (we're in logout process) but still getting
        // events with session (which can happen due to timing), ignore them
        if (user === null && session && event !== 'SIGNED_IN') {
          console.log('AuthProvider: Ignoring auth event during logout process');
          setIsLoading(false);
          return;
        }
        
        // Do a fresh session check if we're refreshing the page or receiving events
        // after a rapid series of refreshes
        if (event === 'INITIAL_SESSION') {
          // Double-check session validity directly
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            console.log('AuthProvider: No valid session found during INITIAL_SESSION check');
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
        
        if (session?.user) {
          // OPTIMISTIC UI: Session exists, assume logged in immediately with basic info
          console.log(`AuthProvider: Session found (User ID: ${session.user.id}). Setting minimal user & isLoading=false.`);
          setUser(prevUser => {
              // Keep existing full profile if we already have it, otherwise use minimal info
              if (prevUser && prevUser.id === session.user.id && prevUser.full_name) {
                  return prevUser;
              }
              // Construct minimal user from session
              return {
                 id: session.user.id,
                 email: session.user.email || '',
                 full_name: session.user.user_metadata?.full_name || session.user.email || 'User', // Best guess for name
                 // Add other fields as undefined/empty if needed by User type
                 bio: undefined, 
                 industry: undefined,
                 skills: undefined,
                 // ... etc
              };
          });
          setIsLoading(false); // <-- Set loading false EARLY

          // Only fetch full profile if we're not already in the logout process
          if (user !== null || event === 'SIGNED_IN') {
            // Now, fetch full profile in the background
            console.log(`AuthProvider: Fetching full profile in background...`);
            const userData = await getUserData(session.user.id); // getUserData already has retry logic
            
            if (userData) {
              // Check if we're still logged in with same user before updating
              if (user?.id === session.user.id) {
                // Full profile loaded, update the user state silently
                console.log(`AuthProvider: Full profile loaded. Updating user state.`);
                setUser(userData);
              }
            } else {
              // Failed to load full profile after retries
              console.error(`AuthProvider: Failed to load full profile for user ${session.user.id} after retries.`);
              setError('Could not load full user profile. Some features might be limited.'); // Non-blocking error
              // We keep the minimal user state set earlier, so the user still appears logged in.
            }
          }

          // Handle redirect only on explicit SIGNED_IN from an auth page
          if (event === 'SIGNED_IN') {
            const currentPath = window.location.pathname;
            console.log(`AuthProvider: SIGNED_IN event detected on path: ${currentPath}`);
            if (currentPath.startsWith('/auth/')) {
              console.log('AuthProvider: Redirecting from auth page to / after SIGNED_IN');
              router.push('/'); 
            }
          }

        } else {
          // This will handle both null session cases and SIGNED_OUT has been handled above
          console.log('AuthProvider: No active session found. Setting user state to null & isLoading=false.');
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // Clean up the subscription
    return () => {
      console.log('AuthProvider: Unsubscribing from onAuthStateChange.');
      subscription.unsubscribe();
    };
  }, [router]); // Dependency array remains [router]
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Auth error during login:', error.message);
        setError(error.message);
        return false;
      }
      
      console.log('Login successful');
      return true;
    } catch (error: any) {
      console.error('Exception during login:', error.message || error);
      setError(error.message || "An error occurred during login");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out the user
  const signOut = async () => {
    try {
      // Clear user state immediately
      setUser(null);
      setError(null);
      console.log('AuthProvider: Attempting signOut...');
      
      // Call supabase signOut
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider: signOut error:', error.message);
        setError(`Logout failed: ${error.message}`);
        throw error;
      }
      
      console.log('AuthProvider: signOut successful. Clearing storage and cookies.');
      
      // Remove any lingering Supabase tokens from storage
      window.localStorage.clear();
      window.sessionStorage.clear();
      
      // Clear all cookies (including SSR session cookies)
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.split('=');
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      
      // Redirect to landing page
      router.push('/');
    } catch (err: unknown) {
      console.error('AuthProvider: signOut exception:', err);
      setError(`Logout failed unexpectedly.`);
      setIsLoading(false);
    }
  };

  // Sign up a new user
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate input
      if (!email || !password) {
        setError("Email and password are required");
        return false;
      }

      // Sign up with Supabase
      console.log('Initiating signup with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Use window.location.origin to ensure proper redirects
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Error during signup:', error.message);
        setError(error.message);
        return false;
      }

      if (data?.user) {
        console.log('Signup successful. User created with ID:', data.user.id);
        
        // Store email in localStorage for potential resend verification needs
        localStorage.setItem("lastSignupEmail", email);
        
        // Create initial profile in the users table
        let profileCreated = false;
        
        try {
          // First check if profile already exists
          console.log('Checking if user profile already exists in database');
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();
            
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking for existing user:', checkError);
            console.error('Error code:', checkError.code);
            console.error('Error details:', checkError.details);
          }
            
          if (!existingUser) {
            // Create the user profile with required fields
            console.log('No existing profile found, creating new profile');
            const initialProfile = {
              id: data.user.id,
              email: email,
              full_name: fullName,
              contact: { email: email },
              industry: [],
              skills: [],
              views: 0,
              is_texas_am_affiliate: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted: false
            };
              
            console.log('Attempting to insert user profile:', initialProfile);
              
            const { error: profileError } = await supabase
              .from('users')
              .insert([initialProfile]);
                
            if (profileError) {
              console.error('Failed to create initial profile:', profileError);
              // Log detailed error information for debugging
              console.error('Error code:', profileError.code);
              console.error('Error details:', profileError.details);
              console.error('Error hint:', profileError.hint);
              
              // Set a more specific error message for database errors
              if (profileError.code?.startsWith('23') || profileError.code?.startsWith('42')) {
                // These are common Postgres constraint/schema errors
                setError(`Database error creating profile: ${profileError.message}. You can continue and complete your profile later.`);
              } else {
                setError(`Note: ${profileError.message}. You may need to complete your profile later.`);
              }
            } else {
              console.log('User profile created successfully');
              profileCreated = true;
            }
          } else {
            console.log('User profile already exists');
            profileCreated = true;
          }
        } catch (profileError: any) {
          console.error('Exception during profile creation:', profileError);
          console.error('Error stack:', profileError.stack);
          // Continue anyway since auth was successful
          setError(`Note: ${profileError.message}. You may need to complete your profile later.`);
        }
        
        // For email confirmation flows, we won't have a session yet
        console.log('Checking if session exists:', !!data.session);
        console.log('User needs to verify email:', !data.session);
        
        // Always redirect to waiting page after signup
        // The waiting page will handle both verification and profile completion flows
        router.push('/auth/waiting');
        
        // Return true to indicate signup was successful (even if verification is pending)
        return true;
      } else {
        console.error('Signup completed but user object is null');
        setError("An unexpected error occurred during signup.");
        return false;
      }
    } catch (error: any) {
      console.error('Exception during signup:', error.message || error);
      console.error('Error stack:', error.stack);
      setError(error.message || "An error occurred during sign up");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Error during Google sign in:', error.message);
        setError(error.message);
        return false;
      }
      
      // This is usually not reached immediately because of the redirect
      return true;
    } catch (error: any) {
      console.error('Exception during Google sign in:', error.message || error);
      setError(error.message || "An error occurred during sign in with Google");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with GitHub OAuth
  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Error during GitHub sign in:', error.message);
        setError(error.message);
        return false;
      }
      
      // This is usually not reached immediately because of the redirect
      return true;
    } catch (error: any) {
      console.error('Exception during GitHub sign in:', error.message || error);
      setError(error.message || "An error occurred during sign in with GitHub");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string) => {
     try {
      setIsLoading(true);
      setError(null);
      console.log('AuthProvider: Requesting password reset for', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        console.error('AuthProvider: Password reset request error:', error.message);
         setError(`Failed to send reset email: ${error.message}`);
        throw error;
      }
      console.log('AuthProvider: Password reset email sent successfully.');
      alert('Password reset email sent. Please check your inbox.'); // Provide feedback
    } catch (err: unknown) {
      // Error logged above
       // setError might already be set
    } finally {
       console.log("AuthProvider: requestPasswordReset finished.");
      setIsLoading(false);
    }
  };

  // Reset password (called from reset password page)
  const resetPassword = async (password: string) => {
     try {
      setIsLoading(true);
      setError(null);
      console.log('AuthProvider: Attempting password update (reset)...');
      // This requires the user to be logged in via the recovery link
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        console.error('AuthProvider: Password reset (updateUser) error:', error.message);
         setError(`Password reset failed: ${error.message}`);
        throw error;
      }
      console.log('AuthProvider: Password reset successful. Redirecting to login...');
      alert('Password successfully reset. Please log in with your new password.');
      router.push('/auth/login?reset=success'); 
    } catch (err: unknown) {
       // Error logged above
    } finally {
       console.log("AuthProvider: resetPassword finished.");
      setIsLoading(false);
    }
  };

  // Legacy methods - keep them pointing to new methods
  const login = async (email: string, password: string) => {
    return await signIn(email, password);
  };

  const signup = async (email: string, password: string, userData: Partial<User>) => {
    return await signUp(email, password, userData.full_name || '');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout: signOut,
        signup,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGitHub,
        requestPasswordReset,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
} 