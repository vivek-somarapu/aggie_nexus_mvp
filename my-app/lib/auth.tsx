"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
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
      // Select only essential columns initially to reduce data payload
      const essentialColumns = 'id, full_name, email, avatar, is_texas_am_affiliate, graduation_year';
      
      const MAX_RETRIES = 2; // Increased retries from 1 to 2
      const FETCH_TIMEOUT = 15000; // Increased from 10 to 15 seconds
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        console.log(`AuthProvider: Attempt ${attempt + 1} to fetch profile for user ID: ${userId}`);
        let profileData: User | null = null;
        let fetchError: any = null;
        let timedOut = false;
        
        try {
          const fetchPromise = supabase
            .from('users')
            .select(essentialColumns) // Use only essential columns for quicker response
            .eq('id', userId)
            .single();
            
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Profile fetch attempt ${attempt + 1} timed out`)), FETCH_TIMEOUT)
          );
  
          // Race the fetch against the timeout
          const result = await Promise.race([fetchPromise, timeoutPromise]) as { data: User | null; error: any };
  
          if (result.error) {
             fetchError = result.error;
             console.error(`AuthProvider: Attempt ${attempt + 1} - Error fetching profile for user ${userId}:`, fetchError.message);
             if (fetchError.code === 'PGRST116') { 
               console.warn(`AuthProvider: Profile not found for user ${userId}.`);
               // No point retrying if profile not found
               return null; 
             }
          } else if (result.data) {
             profileData = result.data as User;
             console.log(`AuthProvider: Attempt ${attempt + 1} - Essential profile data successfully fetched for user ${userId}.`);
             
             // Fill in missing fields with empty/default values to ensure type safety
             const fullUser: User = {
                ...profileData,
                bio: profileData.bio || undefined,
                industry: profileData.industry || [],
                skills: profileData.skills || [],
                linkedin_url: profileData.linkedin_url || undefined,
                website_url: profileData.website_url || undefined,
                resume_url: profileData.resume_url || undefined,
                additional_links: profileData.additional_links || [],
                contact: profileData.contact || { email: profileData.email },
                views: profileData.views || 0
             };
             
             return fullUser;
          } else {
             console.warn(`AuthProvider: Attempt ${attempt + 1} - No profile data returned for user ${userId}, though no explicit error occurred.`);
             fetchError = new Error('No profile data returned despite success status.');
          }
  
        } catch (err: any) { 
          fetchError = err;
          if (err.message?.includes('timed out')) {
              timedOut = true;
              console.warn(`AuthProvider: Attempt ${attempt + 1} - ${err.message}`);
          } else {
              console.error(`AuthProvider: Attempt ${attempt + 1} - Exception during profile fetch for user ${userId}:`, err.message || err);
          }
        }
        
        // If we are on the last attempt and it failed/timed out, log final failure but return minimal user
        if (attempt === MAX_RETRIES) {
            console.error(`AuthProvider: Final attempt failed. Could not fetch full profile for ${userId}. Creating minimal user object.`);
            // Return minimal user instead of null to ensure UI works even with database issues
            return {
              id: userId,
              email: '', // This might be available from auth session if needed
              full_name: 'User',
              industry: [],
              skills: [],
              views: 0,
            } as User;
        }

        // If timed out, wait a short moment before retrying (optional)
        if (timedOut) {
            console.log('AuthProvider: Waiting briefly before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second (increased from 500ms)
        }
      }
      
      return null;
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
          
          // Ensure we don't reuse sessions after logout
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          
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
      console.log('AuthProvider: Attempting signInWithPassword for', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('AuthProvider: signIn error:', error.message);
        setError(`Login failed: ${error.message}`); // Provide specific error
        throw error;
      }
      console.log('AuthProvider: signIn successful. Session:', data.session ? 'valid' : 'invalid');
      // Let onAuthStateChange handle user state update and redirection
    } catch (err: unknown) {
      // Error already logged, ensure isLoading is false
      // setError is already set in the 'if (error)' block
    } finally {
      // Delay setting isLoading to false slightly AFTER signIn completes? Maybe not needed.
       console.log("AuthProvider: signIn finished, setting isLoading to false.");
      setIsLoading(false);
    }
  };
  
  // Sign out the user
  const signOut = async () => {
    try {
      // Set user to null FIRST before calling signOut
      // This prevents any fetch operations from continuing
      setUser(null);
      
      // Clear any errors
      setError(null);
      console.log('AuthProvider: Attempting signOut...');
      
      // Use the scope option to completely remove ALL local session data
      const { error } = await supabase.auth.signOut({ 
        scope: 'global' // This clears all sessions, not just the current tab
      });
      
      if (error) {
        console.error('AuthProvider: signOut error:', error.message);
        setError(`Logout failed: ${error.message}`);
        throw error;
      }
      
      console.log('AuthProvider: signOut successful.');
      
      // Force redirect to landing page (not login page)
      router.push('/');
      
      // Force a hard refresh to clear any client-side caches
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
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
      console.log('AuthProvider: Attempting signUp for', email);
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (authError) {
        console.error('AuthProvider: signUp auth error:', authError.message);
        setError(`Signup failed: ${authError.message}`);
        throw authError;
      }

      // Important: Supabase signUp might require email verification by default.
      // The user object might exist but session might be null until verification.
      if (data.user) {
        console.log(`AuthProvider: Auth account created (User ID: ${data.user.id}). Creating profile...`);
        
        // Check if a session is immediately available (might not be if email verification is needed)
         console.log('AuthProvider: Session after signUp:', data.session ? 'Exists' : 'Null (Email verification likely required)');

        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            contact: { email } 
          });

        if (profileError) {
          console.error('AuthProvider: User profile creation error:', profileError.message);
          // Potentially try to clean up the auth user if profile creation fails? Complex.
          setError(`Signup succeeded, but profile creation failed: ${profileError.message}`);
          throw profileError;
        }
        
        console.log('AuthProvider: Profile created successfully.');
        // Redirect to login, inform user to check email if verification is enabled
         setError(null); // Clear previous error
         alert('Signup successful! Please check your email to verify your account before logging in.'); // Simple alert
         router.push('/auth/login'); // Redirect to login after signup

      } else {
         // This case might occur if user creation failed silently or if email verification is mandatory and user object isn't returned immediately.
         console.warn('AuthProvider: signUp completed but data.user is null. Check Supabase email verification settings.');
         setError('Signup process did not complete as expected. Please try again or contact support.');
      }
    } catch (err: unknown) {
       // Errors should be logged and set in the specific catch blocks above
       console.error("AuthProvider: Overall signUp catch block:", err);
    } finally {
       console.log("AuthProvider: signUp finished, setting isLoading to false.");
      setIsLoading(false);
    }
  };

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      // setIsLoading(true); // Maybe set loading later after redirect potentially starts?
      setError(null);
      console.log('AuthProvider: Initiating Google signInWithOAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) {
        console.error('AuthProvider: Google signInWithOAuth error:', error.message);
        setError(`Google login failed: ${error.message}`);
        throw error;
      }
      // Browser will redirect, loading state might not be relevant here until callback
      console.log('AuthProvider: Redirecting to Google...');
    } catch (err: unknown) {
      console.error('AuthProvider: Google signInWithOAuth exception:', err);
      setError('Failed to start Google login.');
      // setIsLoading(false); // Ensure loading is false if redirect fails
    } 
    // No finally block for setIsLoading(false) because of redirect
  };

  // Sign in with GitHub OAuth
  const signInWithGitHub = async () => {
     try {
      // setIsLoading(true);
      setError(null);
      console.log('AuthProvider: Initiating GitHub signInWithOAuth...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) {
        console.error('AuthProvider: GitHub signInWithOAuth error:', error.message);
        setError(`GitHub login failed: ${error.message}`);
        throw error;
      }
       console.log('AuthProvider: Redirecting to GitHub...');
    } catch (err: unknown) {
      console.error('AuthProvider: GitHub signInWithOAuth exception:', err);
      setError('Failed to start GitHub login.');
      // setIsLoading(false);
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
  const login = signIn;
  const logout = signOut;
  const signup = (email: string, password: string, userData: Partial<User>) => {
     // Ensure full_name is passed correctly if userData has it
    return signUp(email, password, userData.full_name || ''); 
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
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