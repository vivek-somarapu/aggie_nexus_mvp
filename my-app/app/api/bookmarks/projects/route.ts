import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Fetch project bookmarks for the current authenticated user
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = user.id;
  
  try {
    const { data, error } = await supabase
      .from('project_bookmarks')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching project bookmarks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Exception in project bookmarks API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Toggle a project bookmark
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = user.id;
  
  try {
    const requestData = await request.json();
    const { projectId } = requestData;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Check if bookmark already exists
    const { data: existingBookmark, error: fetchError } = await supabase
      .from('project_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
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
        .from('project_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);
        
      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'removed', projectId };
    } else {
      // Otherwise, add it
      const { error: insertError } = await supabase
        .from('project_bookmarks')
        .insert({
          user_id: userId,
          project_id: projectId,
          saved_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error adding bookmark:', insertError);
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'added', projectId };
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('Exception in toggle project bookmark API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
} 