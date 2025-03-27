import { User } from "@/lib/models/users";

export interface UserSearchParams {
  search?: string;
  skill?: string;
}

export const userService = {
  // Get all users
  getUsers: async (params?: UserSearchParams): Promise<User[]> => {
    let url = '/api/users';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.skill) searchParams.append('skill', params.skill);
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<User | null> => {
    const response = await fetch(`/api/users/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Advanced search for users
  searchUsers: async (query: string, skill?: string): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (skill) searchParams.append('skill', skill);
    
    const response = await fetch(`/api/search/users?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update an existing user
  updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete a user
  deleteUser: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  },
}; 