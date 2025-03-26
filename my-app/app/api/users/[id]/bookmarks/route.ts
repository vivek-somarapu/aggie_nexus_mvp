import { NextRequest, NextResponse } from 'next/server';
import { getUserBookmarks, getProjectBookmarks } from '@/lib/models/bookmarks';
import { getUserById } from '@/lib/models/users';
import { getProjectById } from '@/lib/models/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
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
    const bookmarkedUsers = await Promise.all(
      userBookmarks.map(async (bookmark) => {
        const user = await getUserById(bookmark.bookmarked_user_id);
        return {
          id: bookmark.id,
          saved_at: bookmark.saved_at,
          user: user
        };
      })
    );
    
    // Fetch the actual bookmarked project details
    const bookmarkedProjects = await Promise.all(
      projectBookmarks.map(async (bookmark) => {
        const project = await getProjectById(bookmark.project_id);
        return {
          id: bookmark.id,
          saved_at: bookmark.saved_at,
          project: project
        };
      })
    );
    
    return NextResponse.json({
      bookmarkedUsers,
      bookmarkedProjects
    });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
  }
} 