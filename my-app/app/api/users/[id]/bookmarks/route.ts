import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow users to access their own bookmarks
    if (id !== user.id) {
      return NextResponse.json(
        { error: 'You can only access your own bookmarks' },
        { status: 403 }
      );
    }
    
    // Get user bookmarks
    const { data: userBookmarks, error: userBookmarksError } = await supabase
      .from('user_bookmarks')
      .select('id, bookmarked_user_id, saved_at')
      .eq('user_id', id);
      
    if (userBookmarksError) {
      console.error('Error fetching user bookmarks:', userBookmarksError);
      return NextResponse.json(
        { error: 'Failed to fetch user bookmarks' },
        { status: 500 }
      );
    }
    
    // Get project bookmarks
    const { data: projectBookmarks, error: projectBookmarksError } = await supabase
      .from('project_bookmarks')
      .select('id, project_id, saved_at')
      .eq('user_id', id);
      
    if (projectBookmarksError) {
      console.error('Error fetching project bookmarks:', projectBookmarksError);
      return NextResponse.json(
        { error: 'Failed to fetch project bookmarks' },
        { status: 500 }
      );
    }
    
    // Fetch all bookmarked users
    const bookmarkedUserIds = userBookmarks?.map(bookmark => bookmark.bookmarked_user_id) || [];
    let bookmarkedUsers: any[] = [];
    
    if (bookmarkedUserIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', bookmarkedUserIds);
        
      if (usersError) {
        console.error('Error fetching bookmarked users:', usersError);
      } else {
        bookmarkedUsers = users || [];
      }
    }
    
    // Fetch all bookmarked projects
    const bookmarkedProjectIds = projectBookmarks?.map(bookmark => bookmark.project_id) || [];
    let bookmarkedProjects: any[] = [];
    
    if (bookmarkedProjectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', bookmarkedProjectIds);
        
      if (projectsError) {
        console.error('Error fetching bookmarked projects:', projectsError);
      } else {
        bookmarkedProjects = projects || [];
      }
    }
    
    return NextResponse.json({
      users: bookmarkedUsers,
      projects: bookmarkedProjects
    });
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 