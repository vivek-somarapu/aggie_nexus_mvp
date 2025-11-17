import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Fetch organization bookmarks for the current authenticated user
 */
export async function GET() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = user.id;
  
  try {
    const { data, error } = await supabase
      .from('organization_bookmarks')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching organization bookmarks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Exception in organization bookmarks API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: Toggle an organization bookmark
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
    const { orgId } = requestData;
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }
    
    // Check if bookmark already exists
    const { data: existingBookmark, error: fetchError } = await supabase
      .from('organization_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
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
        .from('organization_bookmarks')
        .delete()
        .eq('id', existingBookmark.id);
        
      if (deleteError) {
        console.error('Error removing bookmark:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'removed', orgId };
    } else {
      // Otherwise, add it
      const { error: insertError } = await supabase
        .from('organization_bookmarks')
        .insert({
          user_id: userId,
          org_id: orgId,
          saved_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error adding bookmark:', insertError);
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        );
      }
      
      result = { action: 'added', orgId };
    }
    
    return NextResponse.json(result);
  } catch (err) {
    console.error('Exception in toggle organization bookmark API:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

