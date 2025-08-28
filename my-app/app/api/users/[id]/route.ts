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
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ 
          error: 'Failed to delete user',
          details: error.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'User deleted successfully' 
      });
    } catch (error) {
      console.error('User DELETE API error:', error);
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  });
} 