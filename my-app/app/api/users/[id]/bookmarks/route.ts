import { NextRequest, NextResponse } from 'next/server';
import { getUserBookmarks, getProjectBookmarks } from '@/lib/models/bookmarks';
import { getUserById } from '@/lib/models/users';
import { getProjectById } from '@/lib/models/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // No need to await params, directly access the id property
    const { id: userId } = params;
    
    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get both user and project bookmarks in parallel
    const [userBookmarks, projectBookmarks] = await Promise.all([
      getUserBookmarks(userId),
      getProjectBookmarks(userId)
    ]);
    
    // Fetch the actual bookmarked user details
    const bookmarkedUsersPromises = userBookmarks.map(async (bookmark) => {
      try {
        const user = await getUserById(bookmark.bookmarked_user_id);
        if (!user) return null;
        
        return {
          id: bookmark.id,
          saved_at: bookmark.saved_at,
          user
        };
      } catch (error) {
        console.error(`Error fetching bookmarked user ${bookmark.bookmarked_user_id}:`, error);
        return null;
      }
    });
    
    // Fetch the actual bookmarked project details
    const bookmarkedProjectsPromises = projectBookmarks.map(async (bookmark) => {
      try {
        const project = await getProjectById(bookmark.project_id);
        if (!project) return null;
        
        return {
          id: bookmark.id,
          saved_at: bookmark.saved_at,
          project
        };
      } catch (error) {
        console.error(`Error fetching bookmarked project ${bookmark.project_id}:`, error);
        return null;
      }
    });
    
    // Resolve all promises and filter out nulls
    const [bookmarkedUsers, bookmarkedProjects] = await Promise.all([
      Promise.all(bookmarkedUsersPromises),
      Promise.all(bookmarkedProjectsPromises)
    ]);
    
    return NextResponse.json({
      users: bookmarkedUsers.filter(Boolean).map(item => item?.user),
      projects: bookmarkedProjects.filter(Boolean).map(item => item?.project)
    });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
  }
} 