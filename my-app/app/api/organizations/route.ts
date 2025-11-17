import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/organizations - List all organizations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    console.log('Fetching organizations from API');
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const sortParam = searchParams.get('sort');
    const orderParam = searchParams.get('order');
    
    // Create a query builder
    let query = supabase
      .from('organizations')
      .select(`
        *,
        organization_images(id, url, position)
      `);
    
    // Apply search filter if provided
    if (searchTerm) {
      // Search in name and description (case-insensitive)
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    // Apply sorting
    const validSortFields = ['name', 'created_at', 'updated_at'];
    const sortField = sortParam && validSortFields.includes(sortParam) ? sortParam : 'name';
    const ascending = orderParam === 'asc';
    
    // Default to ascending for name if no order specified
    const shouldAscend = sortParam ? ascending : true;
    
    query = query.order(sortField, { ascending: shouldAscend });
    
    const { data: organizations, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch organizations: ' + error.message }, { status: 500 });
    }
    
    // Process organizations to ensure consistent format
    const processedOrganizations = (organizations || []).map(org => {
      // Sort images by position
      const sortedImages = (org.organization_images || [])
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((img: { url: string }) => img.url);
      
      return {
        ...org,
        logo_url: org.logo_url || null,
        images: sortedImages,
        contact: org.contact || {},
        additional_links: org.additional_links || [],
      };
    });
    
    console.log(`Fetched ${processedOrganizations.length} organizations successfully`);
    return NextResponse.json(processedOrganizations);
  } catch (error: unknown) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

