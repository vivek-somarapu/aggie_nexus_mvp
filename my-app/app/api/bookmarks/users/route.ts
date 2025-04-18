import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Fetch user bookmarks
 */
export async function GET(request: NextRequest) {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', session.user.id);
      
    if (error) {
      console.error('Error fetching user bookmarks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Exception in user bookmarks API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Toggle a user bookmark
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    const requestData = await request.json();
    const { bookmarked_user_id } = requestData;
    
    if (!bookmarked_user_id) {
      return NextResponse.json(
        { error: 'Bookmarked user ID is required' },
        { status: 400 }
      );
    }
    
    // Check if bookmark already exists
    const { data: existingBookmark, error: fetchError } = await supabase
      .from('user_bookmarks')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('bookmarked_user_id', bookmarked_user_id)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing bookmark:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check bookmark status' },
        { status: 500 }
      );
    }
    
    let result;
    
    // Toggle the bookmark - if it exists, remove it
    if (existingBookmark) {
      const { error: deleteError } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);
        
      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'removed', bookmarked_user_id };
    } else {
      // Otherwise, add it
      const { error: insertError } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: session.user.id,
          bookmarked_user_id,
        });
        
      if (insertError) {
        console.error('Error adding bookmark:', insertError);
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'added', bookmarked_user_id };
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('Exception in toggle user bookmark API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 