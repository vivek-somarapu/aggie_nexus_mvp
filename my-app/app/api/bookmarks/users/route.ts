import { NextRequest, NextResponse } from 'next/server';
import { getUserBookmarks, toggleUserBookmark } from '@/lib/models/bookmarks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const bookmarks = await getUserBookmarks(userId);
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch user bookmarks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.userId || !body.bookmarkedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and bookmarkedUserId are required' },
        { status: 400 }
      );
    }
    
    const isBookmarked = await toggleUserBookmark(body.userId, body.bookmarkedUserId);
    return NextResponse.json({ isBookmarked });
  } catch (error) {
    console.error('Error toggling user bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle user bookmark' }, { status: 500 });
  }
} 