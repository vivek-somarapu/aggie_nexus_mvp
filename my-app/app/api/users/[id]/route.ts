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
    const { id } = params;
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
    let updateError = null;
    
    // NEW: Simplified approach - focus on ensuring the users table is updated correctly
    // Instead of trying both profiles and users tables which might cause conflicts
    
    try {
      // Check if user exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();
        
      if (checkError) {
        console.log(`User check error (code: ${checkError.code}):`, checkError);
        // Only treat PGRST116 (not found) as non-error
        if (checkError.code !== 'PGRST116') {
          console.error('Error checking if user exists:', checkError);
        }
      }
      
      if (existingUser) {
        // User exists, update it
        console.log(`User ${id} found in users table, updating...`);
        
        // For debugging, print exactly what we're sending to the database
        console.log('Update payload:', JSON.stringify(dataWithTimestamp, null, 2));
        
        const { data, error } = await supabase
          .from('users')
          .update(dataWithTimestamp)
          .eq('id', id)
          .select()
          .single();
          
        userData = data;
        updateError = error;
        
        if (error) {
          console.error('Error updating users table:', error);
          console.error('Error details:', error.details, 'Error hint:', error.hint);
        } else {
          console.log('Successfully updated users table');
        }
      } else {
        // User doesn't exist, insert it
        console.log(`User ${id} not found in users table, creating new entry...`);
        
        // Add required fields
        const completeUserData = {
          ...dataWithTimestamp,
          id: id,
          views: 0,
          deleted: false,
          created_at: new Date().toISOString()
        };
        
        // For debugging, print exactly what we're sending to the database
        console.log('Insert payload:', JSON.stringify(completeUserData, null, 2));
        
        const { data, error } = await supabase
          .from('users')
          .insert([completeUserData])
          .select()
          .single();
          
        userData = data;
        updateError = error;
        
        if (error) {
          console.error('Error inserting into users table:', error);
          console.error('Error details:', error.details, 'Error hint:', error.hint);
        } else {
          console.log('Successfully inserted into users table');
        }
      }
    } catch (e) {
      console.error('Exception updating users table:', e);
      updateError = e;
    }
    
    // If we have user data, return it
    if (userData) {
      return NextResponse.json(userData);
    }
    
    // If we got here with an error, something went wrong
    if (updateError) {
      // Enhanced error details for debugging
      let errorMessage = 'Unknown error';
      if (typeof updateError === 'object' && updateError !== null) {
        if ('message' in updateError) {
          errorMessage = (updateError as any).message;
        }
        if ('details' in updateError) {
          errorMessage += ` - Details: ${(updateError as any).details}`;
        }
      }
      
      console.error(`Error updating user with detailed message: ${errorMessage}`);
      
      return NextResponse.json({ 
        error: `Failed to update user: ${errorMessage}` 
      }, { status: 500 });
    }
    
    // If we got here without user data or error, try to fetch current user
    console.log('No data returned from update operations, fetching current user data...');
    
    // Try users table first
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (!fetchError && currentUser) {
      return NextResponse.json(currentUser);
    }
    
    // If we still don't have data, return what was submitted
    return NextResponse.json({
      ...dataWithTimestamp,
      id: id
    });
    
  } catch (error: any) {
    console.error('Exception during user update:', error);
    let errorMessage = 'Unknown error';
    
    if (error && typeof error === 'object') {
      if ('message' in error) errorMessage = error.message;
      if ('stack' in error) console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json({ 
      error: `Failed to update user: ${errorMessage}` 
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