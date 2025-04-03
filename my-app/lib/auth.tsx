"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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

// Initialize Supabase client outside of component to avoid recreation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Make sure we have valid config
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create a stable Supabase instance
const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!,
  {
    auth: {
      persistSession: true,
      storageKey: 'aggie-nexus-auth',
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

// Create a provider component that will wrap the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check for user session on mount and listen for auth changes
  useEffect(() => {
    console.log('Auth provider initializing...');
    
    // Function to fetch user data with a fallback
    const getUserData = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('Error fetching user data:', error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error('Unexpected error fetching user data:', err);
        return null;
      }
    };
    
    // Check the current session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Authentication error');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('Found existing session, fetching user data...');
          const userData = await getUserData(session.user.id);
          
          if (userData) {
            console.log('User data loaded successfully');
            setUser(userData);
          } else {
            console.log('No user data found, treating as logged out');
            setUser(null);
          }
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initialize auth
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session ? `with session (user: ${session.user.id})` : 'no session');
        
        if (event === 'SIGNED_IN' && session) {
          setIsLoading(true);
          
          try {
            const userData = await getUserData(session.user.id);
            
            if (userData) {
              setUser(userData);
              console.log('User signed in and profile loaded:', userData.full_name);
              
              // Only redirect if we're on an auth page and not already redirecting
              const currentPath = window.location.pathname;
              if (currentPath.startsWith('/auth/') && currentPath !== '/auth/callback') {
                console.log('Redirecting from auth page to home after login');
                
                // Use a more reliable way to navigate
                window.location.href = '/';
              }
            } else {
              setError('Failed to load user profile');
            }
          } catch (err) {
            console.error('Error handling sign in event:', err);
            setError('Failed to process authentication');
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          console.log('User signed out');
          
          // Check if we need to redirect after sign out
          const currentPath = window.location.pathname;
          const protectedRoutes = ['/profile', '/projects/new', '/projects/edit', '/bookmarks'];
          
          if (protectedRoutes.some(route => currentPath.startsWith(route))) {
            console.log('Redirecting from protected page after logout');
            window.location.href = '/';
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          router.push('/auth/reset-password');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Auth token refreshed');
        } else if (event === 'USER_UPDATED') {
          console.log('User data updated, refreshing profile');
          if (session) {
            const userData = await getUserData(session.user.id);
            if (userData) {
              setUser(userData);
            }
          }
        }
      }
    );
    
    // Clean up the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Signing in user:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Sign in successful with session:', data.session ? 'valid' : 'invalid');
      
      // Don't navigate immediately - let the auth state listener handle it
      // The router.push was causing issues with race conditions
      // The auth state change listener will update the user state
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign out the user
  const signOut = async () => {
    try {
      setIsLoading(true);
      
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      setUser(null);
      router.push('/');
    } catch (err: unknown) {
      console.error('Logout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign up a new user
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Creating new account');
      // First create the authentication account
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (authError) {
        console.error('Signup auth error:', authError);
        throw authError;
      }
      
      if (data.user) {
        console.log('Auth account created, creating user profile');
        // Then create the user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            full_name: fullName,
            contact: { email }
          });
        
        if (profileError) {
          console.error('User profile creation error:', profileError);
          throw profileError;
        }
        
        console.log('Signup successful, redirecting to login');
        // Redirect to login with success message
        router.push('/auth/login?signup=success');
      }
    } catch (err: unknown) {
      console.error('Signup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to signup';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initiating Google sign in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Google login error:', error);
        throw error;
      }
    } catch (err: unknown) {
      console.error('Google sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login with Google';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sign in with GitHub OAuth
  const signInWithGitHub = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Initiating GitHub sign in');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('GitHub login error:', error);
        throw error;
      }
    } catch (err: unknown) {
      console.error('GitHub sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login with GitHub';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Requesting password reset for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        console.error('Password reset request error:', error);
        throw error;
      }
      
      console.log('Password reset email sent');
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Resetting password');
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        throw error;
      }
      
      console.log('Password reset successful');
      // Redirect to login with success message
      router.push('/auth/login?reset=success');
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy methods for backward compatibility
  const login = async (email: string, password: string) => {
    return signIn(email, password);
  };
  
  const logout = async () => {
    return signOut();
  };
  
  const signup = async (email: string, password: string, userData: Partial<User>) => {
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