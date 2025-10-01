import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }
      console.error('Error fetching user:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch user',
        details: error.message 
      }, { status: 500 });
    }
    
    // Normalize data structure
    const user = {
      ...data,
      additional_links: data.additional_links || [],
      contact: data.contact || {},
    };
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('User GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId, req) => {
    try {
      const { id } = await params;
      const supabase = await createClient();
      const userData = await request.json();
      
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ 
          error: 'Failed to update user',
          details: error.message 
        }, { status: 500 });
      }
      
      // Normalize data structure
      const user = {
        ...data,
        additional_links: data.additional_links || [],
        contact: data.contact || {},
      };
      
      return NextResponse.json({ user });
    } catch (error) {
      console.error('User PUT API error:', error);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId, req) => {
    try {
      const { id } = await params;
      const supabase = await createClient();
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      const isAdmin = userProfile?.role === 'admin';
      // Admins can delete any user, users can only delete themselves
      if (isAdmin || userId === id) {
        const { deleteUser } = await import("@/lib/models/users");
        const success = await deleteUser(id);
        return NextResponse.json({ success, admin: isAdmin });
      } else {
        return NextResponse.json(
          { error: "You don't have permission to delete this user" },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('User DELETE API error:', error);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  });
}