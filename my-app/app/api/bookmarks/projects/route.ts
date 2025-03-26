import { NextRequest, NextResponse } from 'next/server';
import { getProjectBookmarks, toggleProjectBookmark } from '@/lib/models/bookmarks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const bookmarks = await getProjectBookmarks(userId);
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error fetching project bookmarks:', error);
    return NextResponse.json({ error: 'Failed to fetch project bookmarks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, projectId } = body;
    
    if (!userId || !projectId) {
      return NextResponse.json({ error: 'User ID and Project ID are required' }, { status: 400 });
    }
    
    const result = await toggleProjectBookmark(userId, projectId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling project bookmark:', error);
    return NextResponse.json({ error: 'Failed to toggle project bookmark' }, { status: 500 });
  }
} 