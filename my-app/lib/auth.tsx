"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/utils/supabase/client';

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
  logout: () => void;
  signup: (email: string, password: string, userData: Partial<User>) => Promise<void>;
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: () => {},
  signup: async () => {},
});

// Create a provider component that will wrap the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Check for user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user profile data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) throw userError;
          setUser(userData);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        setError('Failed to authenticate user');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user profile data
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }
          
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    checkUserSession();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First create the authentication account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Then create the user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            full_name: userData.full_name,
            bio: userData.bio,
            industry: userData.industry,
            skills: userData.skills,
            linkedin_url: userData.linkedin_url,
            website_url: userData.website_url,
            resume_url: userData.resume_url,
            additional_links: userData.additional_links,
            contact: userData.contact || { email },
            graduation_year: userData.graduation_year,
            is_texas_am_affiliate: userData.is_texas_am_affiliate,
            avatar: userData.avatar
          });
        
        if (profileError) throw profileError;
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to signup');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        signup
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