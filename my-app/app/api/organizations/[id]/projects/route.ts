import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/organizations/[id]/projects - Get all projects for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // First verify the organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', id)
      .single();
    
    if (orgError || !orgData) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }
    
    // Fetch projects through project_organizations join table
    // Query from projects and filter by project_organizations
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        project_organizations!inner(
          org_id,
          organizations(name)
        )
      `)
      .eq('project_organizations.org_id', id)
      .eq('deleted', false)
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('Error fetching organization projects:', projectsError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization projects',
        details: projectsError.message 
      }, { status: 500 });
    }
    
    // Process projects to match the expected format (similar to projects API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedProjects = (projects || []).map((project: any) => {
      // Extract organizations from project_organizations
      const organizations = (project.project_organizations || [])
        .map((po: { organizations?: { name: string } }) => po.organizations?.name)
        .filter(Boolean);
      
      return {
        ...project,
        organizations: organizations,
        contact_info: project.contact_info || {}
      };
    });
    
    return NextResponse.json(processedProjects);
  } catch (error: unknown) {
    console.error('Organization projects GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

