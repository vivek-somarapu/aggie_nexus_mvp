import { createClient } from '@/lib/supabase/server';

export type UserBookmark = {
  id: string;
  user_id: string;
  bookmarked_user_id: string;
  saved_at: string;
};

export type ProjectBookmark = {
  id: string;
  user_id: string;
  project_id: string;
  saved_at: string;
};

export async function getUserBookmarks(userId: string): Promise<UserBookmark[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user bookmarks:', error);
    throw new Error('Failed to fetch user bookmarks');
  }
  
  return data || [];
}

export async function getProjectBookmarks(userId: string): Promise<ProjectBookmark[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching project bookmarks:', error);
    throw new Error('Failed to fetch project bookmarks');
  }
  
  return data || [];
}

export async function isUserBookmarked(userId: string, bookmarkedUserId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('bookmarked_user_id', bookmarkedUserId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking user bookmark:', error);
    throw new Error('Failed to check user bookmark');
  }
  
  return !!data;
}

export async function isProjectBookmarked(userId: string, projectId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking project bookmark:', error);
    throw new Error('Failed to check project bookmark');
  }
  
  return !!data;
}

export async function toggleUserBookmark(userId: string, bookmarkedUserId: string): Promise<boolean> {
  // Check if already bookmarked
  const exists = await isUserBookmarked(userId, bookmarkedUserId);
  
  if (exists) {
    // Remove bookmark
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('bookmarked_user_id', bookmarkedUserId);
    
    if (error) {
      console.error('Error removing user bookmark:', error);
      throw new Error('Failed to remove user bookmark');
    }
    
    return false;
  } else {
    // Add bookmark
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: userId,
        bookmarked_user_id: bookmarkedUserId,
        saved_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error adding user bookmark:', error);
      throw new Error('Failed to add user bookmark');
    }
    
    return true;
  }
}

export async function toggleProjectBookmark(userId: string, projectId: string): Promise<{ action: 'added' | 'removed' }> {
  // First check if the bookmark exists
  const exists = await isProjectBookmarked(userId, projectId);
  
  if (exists) {
    // Bookmark exists, so remove it
    const supabase = await createClient();
    const { error } = await supabase
      .from('project_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Error removing project bookmark:', error);
      throw new Error('Failed to remove project bookmark');
    }
    
    return { action: 'removed' };
  } else {
    // Bookmark doesn't exist, so add it
    const supabase = await createClient();
    const { error } = await supabase
      .from('project_bookmarks')
      .insert({
        user_id: userId,
        project_id: projectId,
        saved_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error adding project bookmark:', error);
      throw new Error('Failed to add project bookmark');
    }
    
    return { action: 'added' };
  }
}

// RELATIONSHIP QUERIES - Leverage Supabase's join capabilities

export type UserBookmarkWithDetails = UserBookmark & {
  bookmarked_user: {
    id: string;
    full_name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    industry: string[];
    skills: string[];
  };
};

export type ProjectBookmarkWithDetails = ProjectBookmark & {
  project: {
    id: string;
    title: string;
    description: string;
    project_status: string;
    is_idea: boolean;
    owner: {
      id: string;
      full_name: string;
      email: string;
    };
  };
};

export async function getUserBookmarksWithDetails(userId: string): Promise<UserBookmarkWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select(`
      *,
      bookmarked_user:users!user_bookmarks_bookmarked_user_id_fkey (
        id,
        full_name,
        email,
        avatar,
        bio,
        industry,
        skills
      )
    `)
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user bookmarks with details:', error);
    throw new Error('Failed to fetch user bookmarks with details');
  }
  
  return data || [];
}

export async function getProjectBookmarksWithDetails(userId: string): Promise<ProjectBookmarkWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_bookmarks')
    .select(`
      *,
      project:projects!project_bookmarks_project_id_fkey (
        id,
        title,
        description,
        project_status,
        is_idea,
        owner:users!projects_owner_id_fkey (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('user_id', userId)
    .eq('project.deleted', false)
    .order('saved_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching project bookmarks with details:', error);
    throw new Error('Failed to fetch project bookmarks with details');
  }
  
  return data || [];
}

export async function getAllBookmarksForUser(userId: string): Promise<{
  userBookmarks: UserBookmarkWithDetails[];
  projectBookmarks: ProjectBookmarkWithDetails[];
}> {
  const [userBookmarks, projectBookmarks] = await Promise.all([
    getUserBookmarksWithDetails(userId),
    getProjectBookmarksWithDetails(userId)
  ]);
  
  return {
    userBookmarks,
    projectBookmarks
  };
} 