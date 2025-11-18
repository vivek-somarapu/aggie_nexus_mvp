import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from "@supabase/supabase-js";

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
    
    // First get project IDs from project_organizations join table
    // Use service role client to bypass RLS restrictions on the join table
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: projectOrgs, error: projectOrgsError } = await serviceClient
      .from('project_organizations')
      .select('project_id, organizations(name)')
      .eq('org_id', id);
    
    if (projectOrgsError) {
      console.error('Error fetching project organizations:', projectOrgsError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization projects',
        details: projectOrgsError.message 
      }, { status: 500 });
    }
    
    const projectIds = (projectOrgs || []).map((po: { project_id: string }) => po.project_id);
    
    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Now fetch projects by IDs (this respects the public projects RLS policy)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds)
      .eq('deleted', false)
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('Error fetching organization projects:', projectsError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization projects',
        details: projectsError.message 
      }, { status: 500 });
    }
    
    // Create a map of project_id to organization names
    const orgMap = new Map<string, string[]>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (projectOrgs || []).forEach((po: any) => {
      if (!orgMap.has(po.project_id)) {
        orgMap.set(po.project_id, []);
      }
      if (po.organizations?.name) {
        orgMap.get(po.project_id)!.push(po.organizations.name);
      }
    });
    
    // Process projects to match the expected format (similar to projects API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedProjects = (projects || []).map((project: any) => ({
      ...project,
      organizations: orgMap.get(project.id) || [],
      contact_info: project.contact_info || {}
    }));
    
    return NextResponse.json(processedProjects);
  } catch (error: unknown) {
    console.error('Organization projects GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

