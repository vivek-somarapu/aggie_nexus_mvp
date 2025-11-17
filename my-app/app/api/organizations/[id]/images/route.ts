import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// DELETE /api/organizations/[id]/images - Delete an organization image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Check authorization (admin or manager)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = userData?.role === 'admin';
    
    let isManager = false;
    if (!isAdmin) {
      const { data: managerData } = await supabase
        .from('organization_managers')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('org_id', id)
        .single();
      
      isManager = !!managerData;
    }
    
    if (!isAdmin && !isManager) {
      return NextResponse.json({ 
        error: 'Forbidden: You do not have permission to edit this organization' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json({ 
        error: 'Image URL is required' 
      }, { status: 400 });
    }
    
    // Delete the image record
    const { error: deleteError } = await supabase
      .from('organization_images')
      .delete()
      .eq('org_id', id)
      .eq('url', url);
    
    if (deleteError) {
      console.error('Error deleting organization image:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete image',
        details: deleteError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Organization image DELETE API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/organizations/[id]/images - Add organization images
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Check authorization (admin or manager)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = userData?.role === 'admin';
    
    let isManager = false;
    if (!isAdmin) {
      const { data: managerData } = await supabase
        .from('organization_managers')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('org_id', id)
        .single();
      
      isManager = !!managerData;
    }
    
    if (!isAdmin && !isManager) {
      return NextResponse.json({ 
        error: 'Forbidden: You do not have permission to edit this organization' 
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { images } = body; // Array of { url: string, position: number }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ 
        error: 'Images array is required' 
      }, { status: 400 });
    }
    
    // Insert image records
    const imageRecords = images.map((img: { url: string; position: number }) => ({
      org_id: id,
      url: img.url,
      position: img.position
    }));
    
    const { data: insertedImages, error: insertError } = await supabase
      .from('organization_images')
      .insert(imageRecords)
      .select();
    
    if (insertError) {
      console.error('Error inserting organization images:', insertError);
      return NextResponse.json({ 
        error: 'Failed to add images',
        details: insertError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      images: insertedImages
    });
  } catch (error: unknown) {
    console.error('Organization image POST API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

