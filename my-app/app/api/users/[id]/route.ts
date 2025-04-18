import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RouteParams {
  params: {
    id: string;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Increment view count - simpler approach without RPC
    try {
      // First get current view count
      const { data: userData } = await supabase
        .from('users')
        .select('views')
        .eq('id', id)
        .single();
      
      // Then increment it if found
      if (userData) {
        const newViews = (userData.views || 0) + 1;
        await supabase
          .from('users')
          .update({ views: newViews })
          .eq('id', id);
      }
    } catch (viewErr) {
      // Don't let view count errors fail the whole request
      console.error('Error updating view count:', viewErr);
    }
    
    // Get user data from users table first
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('deleted', false)
      .single();
    
    // If not found in users table, try profiles table
    if (error && error.code === 'PGRST116') {
      const { data: profileUser, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return NextResponse.json({ error: 'User not found in any table' }, { status: 404 });
        }
        console.error('Error fetching user from profiles:', profileError);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
      }
      
      return NextResponse.json(profileUser);
    } else if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await Promise.resolve(params); // Properly await dynamic params
    const body = await request.json();
    
    // Verify the requesting user is authorized
    const auth = request.headers.get('Authorization');
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the token from the Authorization header
    const token = auth.replace('Bearer ', '');
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }
    
    // Ensure users can only update their own profile
    if (user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    console.log(`Updating user with ID: ${id}`, JSON.stringify(body, null, 2));
    
    // Remove fields that shouldn't be updated directly
    const { id: userId, views, created_at, updated_at, deleted, ...updateData } = body;
    
    // Add updated_at timestamp
    const dataWithTimestamp = {
      ...updateData,
      updated_at: new Date().toISOString()
    };
    
    // Make sure the contact field is properly structured
    if (dataWithTimestamp.contact && typeof dataWithTimestamp.contact === 'object') {
      // Ensure contact has proper structure
      dataWithTimestamp.contact = {
        email: dataWithTimestamp.email || '',
        ...dataWithTimestamp.contact
      };
    } else {
      // Create default contact object
      dataWithTimestamp.contact = {
        email: dataWithTimestamp.email || ''
      };
    }
    
    // Make sure industry and skills are arrays
    if (!Array.isArray(dataWithTimestamp.industry)) {
      dataWithTimestamp.industry = dataWithTimestamp.industry ? [dataWithTimestamp.industry] : [];
    }
    
    if (!Array.isArray(dataWithTimestamp.skills)) {
      dataWithTimestamp.skills = dataWithTimestamp.skills ? [dataWithTimestamp.skills] : [];
    }
    
    let userData = null;
    
    try {
      // Check if user exists in users table - using auth token directly
      const adminAuthClient = supabase.auth.admin;
      
      // Use rpc to directly perform the update with auth.uid() correctly set
      const { data, error } = await supabase.rpc('update_user_profile', {
        user_id: id,
        user_data: dataWithTimestamp
      });
      
      if (error) {
        console.error('Error in RPC update_user_profile:', error);
        
        // Fallback approach - try direct update with auth token
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update(dataWithTimestamp)
          .eq('id', id)
          .select('*');
          
        if (updateError) {
          console.error('Error updating users table:', updateError);
          if (updateError.code === 'PGRST116') {
            console.log('No rows were returned after update');
          }
          return NextResponse.json({ 
            error: `Failed to update user: ${updateError.message}` 
          }, { status: 500 });
        }
        
        if (!updateData || updateData.length === 0) {
          // The update may have succeeded but returned no rows
          // Get the latest user data
          const { data: latestUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
            
          if (!fetchError && latestUser) {
            return NextResponse.json(latestUser);
          }
          
          return NextResponse.json({ 
            error: 'User not found or no changes were made - auth.uid() may not match' 
          }, { status: 404 });
        }
        
        userData = updateData[0];
      } else {
        userData = data;
      }
      
      return NextResponse.json(userData);
    } catch (e) {
      console.error('Exception updating users table:', e);
      return NextResponse.json({ 
        error: `Failed to update user: ${e instanceof Error ? e.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Exception during user update:', error);
    return NextResponse.json({ 
      error: `Failed to update user: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Soft delete by setting deleted flag
    const { error } = await supabase
      .from('users')
      .update({ deleted: true })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 