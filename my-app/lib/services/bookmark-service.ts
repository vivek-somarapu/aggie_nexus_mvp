import { UserBookmark, ProjectBookmark } from "@/lib/models/bookmarks";
import { User } from "@/lib/models/users";
import { Project } from "@/lib/services/project-service";

export const bookmarkService = {
  // Get user bookmarks for a user
  getUserBookmarks: async (userId: string): Promise<UserBookmark[]> => {
    const response = await fetch(`/api/bookmarks/users`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user bookmarks: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Get project bookmarks for a user
  getProjectBookmarks: async (userId: string): Promise<ProjectBookmark[]> => {
    const response = await fetch(`/api/bookmarks/projects`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project bookmarks: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Get all bookmarks (both users and projects) for a user
  getAllBookmarks: async (userId: string): Promise<{users: User[], projects: Project[]}> => {
    const response = await fetch(`/api/users/${userId}/bookmarks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Toggle a user bookmark
  toggleUserBookmark: async (userId: string, bookmarkedUserId: string): Promise<boolean> => {
    const response = await fetch(`/api/bookmarks/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookmarked_user_id: bookmarkedUserId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle user bookmark: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.action === 'added';
  },
  
  // Toggle a project bookmark
  toggleProjectBookmark: async (userId: string, projectId: string): Promise<{action: 'added' | 'removed'}> => {
    const response = await fetch(`/api/bookmarks/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to toggle project bookmark: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Check if a user is bookmarked
  isUserBookmarked: async (userId: string, bookmarkedUserId: string): Promise<boolean> => {
    try {
      const bookmarks = await bookmarkService.getUserBookmarks(userId);
      return bookmarks.some((bookmark: UserBookmark) => bookmark.bookmarked_user_id === bookmarkedUserId);
    } catch (err) {
      console.error('Error checking user bookmark status:', err);
      return false;
    }
  },
  
  // Check if a project is bookmarked
  isProjectBookmarked: async (userId: string, projectId: string): Promise<boolean> => {
    try {
      const bookmarks = await bookmarkService.getProjectBookmarks(userId);
      return bookmarks.some((bookmark: ProjectBookmark) => bookmark.project_id === projectId);
    } catch (err) {
      console.error('Error checking project bookmark status:', err);
      return false;
    }
  }
}; 