import { supabase } from '../db';

export type User = {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  industry: string[];
  skills: string[];
  linkedin_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  additional_links: Array<{ title: string; url: string }>;
  contact: { email: string; phone?: string };
  views: number;
  graduation_year: number | null;
  is_texas_am_affiliate: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

// CREATE
export async function createUser(userData: Omit<User, 'id' | 'views' | 'created_at' | 'updated_at'>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      full_name: userData.full_name,
      email: userData.email,
      bio: userData.bio,
      industry: userData.industry,
      skills: userData.skills,
      linkedin_url: userData.linkedin_url,
      website_url: userData.website_url,
      resume_url: userData.resume_url,
      additional_links: userData.additional_links || [],
      contact: userData.contact || {},
      graduation_year: userData.graduation_year,
      is_texas_am_affiliate: userData.is_texas_am_affiliate,
      avatar: userData.avatar
    })
    .select('*')
    .single();
    
  if (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
  
  return data;
}

// READ
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('full_name');
  
  if (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
  
  return (data || []).map(user => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found error
      return null;
    }
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
  
  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {}
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Not found error
      return null;
    }
    console.error('Error fetching user by email:', error);
    throw new Error('Failed to fetch user by email');
  }
  
  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {}
  };
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
    .order('full_name');
  
  if (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
  
  return (data || []).map(user => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  }));
}

export async function filterUsersBySkill(skill: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .contains('skills', [skill])
    .order('full_name');
  
  if (error) {
    console.error('Error filtering users by skill:', error);
    throw new Error('Failed to filter users by skill');
  }
  
  return (data || []).map(user => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  }));
}

// UPDATE
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Error updating user:', error);
    return null;
  }
  
  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {}
  };
}

export async function incrementUserViews(id: string): Promise<void> {
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('views')
    .eq('id', id)
    .single();
  
  if (fetchError) {
    console.error('Error fetching user views:', fetchError);
    throw new Error('Failed to fetch user views');
  }
  
  const { error: updateError } = await supabase
    .from('users')
    .update({ views: (userData.views || 0) + 1 })
    .eq('id', id);
  
  if (updateError) {
    console.error('Error incrementing user views:', updateError);
    throw new Error('Failed to increment user views');
  }
}

// DELETE
export async function deleteUser(id: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
  
  return true; // If no error occurred, we can assume successful deletion
}

// Add more functions as needed for searching, filtering, etc. 