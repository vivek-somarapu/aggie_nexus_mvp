import React, { useState, useEffect, createContext, useContext } from 'react';

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
  signup: (userData: Partial<User>) => Promise<void>;
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

  // Check for user session on mount
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // In a real implementation, this would check with your backend
        // to validate the session token stored in cookies/localStorage
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        setError('Failed to authenticate user');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call your login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
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
      
      // In a real implementation, this would call your logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signup = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call your signup endpoint
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }
      
      const newUser = await response.json();
      setUser(newUser);
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