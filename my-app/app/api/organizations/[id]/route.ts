import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/organizations/[id] - Get a single organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_images(id, url, position)
      `)
      .eq('id', id)
      .single();
    
    // Note: Projects and members are fetched via separate endpoints:
    // - /api/organizations/[id]/projects
    // - /api/organizations/[id]/members
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Organization not found' 
        }, { status: 404 });
      }
      console.error('Error fetching organization:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch organization',
        details: error.message 
      }, { status: 500 });
    }
    
    // Sort images by position and keep full records
    const sortedImages = (data.organization_images || [])
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    
    // Normalize data structure
    const organization = {
      ...data,
      logo_url: data.logo_url || null,
      images: sortedImages.map((img: { url: string }) => img.url), // Array of URLs for backward compatibility
      imageRecords: sortedImages, // Full records with id, url, position
      additional_links: data.additional_links || [],
    };
    
    return NextResponse.json({ organization });
  } catch (error: unknown) {
    console.error('Organization GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/organizations/[id] - Update an organization
export async function PATCH(
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
    
    // Check if user is admin or manager of this organization
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
    
    // Verify the organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', id)
      .single();
    
    if (orgError || !orgData) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      website_url,
      logo_url,
      industry,
      founded_date,
      joined_aggiex_date,
    } = body;
    
    // Build update object
    const updateData: {
      name?: string;
      description?: string | null;
      website_url?: string | null;
      logo_url?: string | null;
      industry?: string[];
      founded_date?: string | null;
      joined_aggiex_date?: string | null;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (website_url !== undefined) updateData.website_url = website_url || null;
    if (logo_url !== undefined) updateData.logo_url = logo_url || null;
    if (industry !== undefined) updateData.industry = industry;
    if (founded_date !== undefined) updateData.founded_date = founded_date || null;
    if (joined_aggiex_date !== undefined) updateData.joined_aggiex_date = joined_aggiex_date || null;
    
    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update organization',
        details: updateError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ organization: updatedOrg });
  } catch (error: unknown) {
    console.error('Organization PATCH API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

