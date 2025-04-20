import { User } from "@/lib/models/users";
import { supabase } from "@/lib/db";
import { createClient } from '@/lib/supabase/client';

export interface UserSearchParams {
  search?: string;
  skill?: string;
  tamu?: boolean;
}

// Helper function for retrying fetch operations
const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    if (retries <= 1) throw err;
    console.log(`Retrying fetch to ${url}, ${retries-1} attempts left`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms before retry
    return fetchWithRetry(url, options, retries - 1);
  }
};

export const userService = {
  // Get all users
  getUsers: async (params?: UserSearchParams): Promise<User[]> => {
    let url = '/api/users';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.skill) searchParams.append('skill', params.skill);
      if (params.tamu !== undefined) searchParams.append('tamu', params.tamu.toString());
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    console.log(`Fetching users from ${url}`);
    
    try {
      const response = await fetchWithRetry(url);
      
      if (!response.ok) {
        console.error(`Error fetching users: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const users = await response.json();
      console.log(`Fetched ${users.length} users successfully`);
      return users;
    } catch (error) {
      console.error('Network error fetching users:', error);
      throw error;
    }
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<User | null> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Advanced search for users
  searchUsers: async (query: string, skill?: string): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (skill) searchParams.append('skill', skill);
    
    try {
      const response = await fetchWithRetry(`/api/search/users?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search users: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
    try {
      const supabase = createClient();
      
      // First, get the current user data to validate fields
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Update fields including profile_setup_skipped and profile_setup_completed
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const response = await fetchWithRetry(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  },
}; 