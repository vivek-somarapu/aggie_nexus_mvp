import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching projects from API');
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const skill = searchParams.get('skill');
    const tamuParam = searchParams.get('tamu');
    const isIdeaParam = searchParams.get('is_idea');
    
    // Create a query builder
    let query = supabase.from('projects').select('*').eq('deleted', false);
    
    // Apply filters if provided
    if (searchTerm) {
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    if (skill) {
      query = query.contains('required_skills', [skill]);
    }
    
    // Filter by TAMU affiliation (we need to join with users table)
    if (tamuParam === 'true' || tamuParam === 'false') {
      const isTamu = tamuParam === 'true';
      
      // First get the IDs of projects with TAMU/non-TAMU owners
      const { data: ownerData } = await supabase
        .from('users')
        .select('id')
        .eq('is_texas_am_affiliate', isTamu);
      
      if (ownerData && ownerData.length > 0) {
        const ownerIds = ownerData.map(owner => owner.id);
        query = query.in('owner_id', ownerIds);
      }
    }
    
    // Filter by is_idea if provided
    if (isIdeaParam === 'true' || isIdeaParam === 'false') {
      const isIdea = isIdeaParam === 'true';
      query = query.eq('is_idea', isIdea);
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
    
    // Process projects to ensure consistent format
    const processedProjects = (projects || []).map(project => ({
      ...project,
      industry: project.industry || [],
      required_skills: project.required_skills || [],
      contact_info: project.contact_info || {}
    }));
    
    console.log(`Fetched ${processedProjects.length} projects successfully`);
    return NextResponse.json(processedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, req) => {
    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.title || !body.description) {
        return NextResponse.json(
          { error: 'Missing required fields: title and description are required' },
          { status: 400 }
        );
      }
      
      // Set the owner_id to the authenticated user's ID
      const projectData = {
        ...body,
        owner_id: userId
      };
      
      // Ensure contact_info is properly formatted
      let contact_info = projectData.contact_info || {};
      
      // If contact_info is a string (from older form submissions)
      if (typeof contact_info === 'string') {
        try {
          contact_info = JSON.parse(contact_info);
        } catch (e) {
          contact_info = { email: contact_info };
        }
      }
      
      // Always ensure the object has required properties
      if (!contact_info.email) {
        // Get user email as fallback
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .single();
          
        contact_info.email = userData?.email || '';
      }
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title,
          description: projectData.description,
          owner_id: projectData.owner_id,
          is_idea: projectData.is_idea || false,
          recruitment_status: projectData.recruitment_status || "Not recruiting",
          industry: projectData.industry || [],
          required_skills: projectData.required_skills || [],
          location_type: projectData.location_type || "Remote",
          estimated_start: projectData.estimated_start || null,
          estimated_end: projectData.estimated_end || null,
          contact_info: contact_info,
          project_status: projectData.project_status || "Not Started",
          views: 0,
          deleted: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating project in Supabase:', error);
        return NextResponse.json({ error: 'Failed to create project: ' + error.message }, { status: 500 });
      }
      
      return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project: ' + error.message }, { status: 500 });
    }
  });
} 