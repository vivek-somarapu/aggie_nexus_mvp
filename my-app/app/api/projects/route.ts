import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { createClient } from '@/lib/supabase/server';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client inside the function, not at module level
    const supabase = await createClient();
    console.log('Fetching projects from API');
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const skill = searchParams.get('skill');
    const tamuParam = searchParams.get('tamu');
    const isIdeaParam = searchParams.get('is_idea');
    const ownerIdParam = searchParams.get('owner_id');
    const sortParam = searchParams.get('sort');
    const orderParam = searchParams.get('order');
    const useCustomAlgorithm = searchParams.get('algorithm') === 'recommended';
    
    // Create a query builder
            let query = supabase
          .from('projects')
          .select(`
            *,
            project_organizations(
              organizations(name)
            ),
            project_organization_claims(
              organizations(name),
              status
            )
          `)
          .eq('deleted', false);
    
    // Apply filters if provided
    if (searchTerm) {
      // Match projects whose title contains the search term (case-insensitive)
      query = query.ilike('title', `%${searchTerm}%`);
    }
    
    if (skill) {
      query = query.contains('required_skills', [skill]);
    }
    
    // Filter by owner_id if provided
    if (ownerIdParam) {
      query = query.eq('owner_id', ownerIdParam);
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
    
    // Apply sorting (skip if using custom algorithm - we'll sort after fetching)
    if (!useCustomAlgorithm) {
      // Valid sort fields to prevent SQL injection
      const validSortFields = ['created_at', 'views', 'funding_received', 'title', 'estimated_start', 'last_updated'];
      const sortField = sortParam && validSortFields.includes(sortParam) ? sortParam : 'created_at';
      const ascending = orderParam === 'asc';
      
      // Default to descending for created_at if no order specified
      const shouldAscend = sortParam ? ascending : false;
      
      query = query.order(sortField, { ascending: shouldAscend });
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects: ' + error.message }, { status: 500 });
    }
    
    // Custom recommendation algorithm scoring function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateRecommendationScore = (project: any): number => {
      let score = 0;
      
      // 1. Recency boost (newer projects get higher score)
      const daysSinceCreation = (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 100 - daysSinceCreation * 2); // Decay over time
      score += recencyScore * 0.1; // 10% weight

      // 2. Incubator or Accelerator boost (projects in incubator or accelerator are more relevant)
      const incubatorScore = project.organizations.includes('Aggies Create Incubator') ? 10 : 0;
      score += incubatorScore * 0.1; // 10% weight
      const acceleratorScore = project.organizations.includes('AggieX Accelerator') ? 30 : 0;
      score += acceleratorScore * 0.1; // 10% weight
      
      // 2. Popularity boost (views)
      const viewsScore = Math.log10((project.views || 0) + 1) * 20; // Logarithmic to prevent skewing
      score += viewsScore * 0.05; // 5% weight
      
      // 3. Funding boost (projects with funding are more established)
      const fundingScore = Math.log10((project.funding_received || 0) + 1) * 15;
      score += fundingScore * 0.35; // 35% weight
      
      // 4. Active recruitment boost (actively recruiting projects are more relevant)
      if (project.recruitment_status === 'Actively Recruiting') {
        score += 30 * 0.25; // 25% weight
      } else if (project.recruitment_status === 'Open to Applications') {
        score += 15 * 0.25;
      } else if (project.recruitment_status === 'Not Recruiting') {
        score -= 10 * 0.25; // deduct if not recruiting
      }
      
      // 5. Status boost (ongoing projects are more relevant than completed/not started)
      if (project.project_status === 'Ongoing') {
        score += 20 * 0.1; // 10% weight
      } else if (project.project_status === 'Idea Phase') {
        score += 10 * 0.1;
      }

      // 6. A little luck
      score += Math.random() * 15; 
      
      return score;
    };
    
    // Process projects to ensure consistent format
    let processedProjects = (projects || []).map(project => {
      // Show approved organizations and pending claims separately
      const approvedOrgs = project.project_organizations?.map((po: { organizations?: { name: string } }) => po.organizations?.name).filter(Boolean) || [];
      const pendingOrgs = project.project_organization_claims?.filter((claim: { status: string }) => claim.status === 'pending')
        .map((claim: { organizations?: { name: string } }) => claim.organizations?.name).filter(Boolean) || [];

      return {
        ...project,
        industry: project.industry || [],
        required_skills: project.required_skills || [],
        contact_info: project.contact_info || {},
        funding_received: project.funding_received || 0,
        organizations: approvedOrgs,
        pending_organizations: pendingOrgs,
        technical_requirements: project.technical_requirements || [],
        soft_requirements: project.soft_requirements || []
      };
    });
    
    // Apply custom recommendation algorithm if requested
    if (useCustomAlgorithm) {
      processedProjects = processedProjects
        .map(project => ({
          ...project,
          recommendationScore: calculateRecommendationScore(project)
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore); // Sort by score descending
    }
    
    console.log(`Fetched ${processedProjects.length} projects successfully`);
    return NextResponse.json(processedProjects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, req) => {
    try {
      const supabase = await createClient();
      const body = await req.json();
      
      // Validate required fields
      if (!body.title || !body.description) {
        return NextResponse.json(
          { error: 'Missing required fields: title and description are required' },
          { status: 400 }
        );
      }

      // Validate that project is not in both incubator and accelerator
      if (body.organizations && body.organizations.length > 0) {
        const hasIncubator = body.organizations.includes('Aggies Create Incubator');
        const hasAccelerator = body.organizations.includes('AggieX Accelerator');
        
        if (hasIncubator && hasAccelerator) {
          return NextResponse.json(
            { error: 'A project cannot be part of both an incubator and accelerator program' },
            { status: 400 }
          );
        }
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
          funding_received: projectData.funding_received || 0,
          technical_requirements: projectData.technical_requirements || [],
          soft_requirements: projectData.soft_requirements || [],
          logo_url: projectData.logo_url || null,
          views: 0,
          deleted: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating project in Supabase:', error);
        return NextResponse.json({ error: 'Failed to create project: ' + error.message }, { status: 500 });
      }
      
      // Handle organization relationships - create claims first
      if (body.organizations && body.organizations.length > 0) {
        // Get organization IDs
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name')
          .in('name', body.organizations);
        
        if (orgData && orgData.length > 0) {
          // Insert project-organization claims
          const projectOrgClaims = orgData.map(org => ({
            project_id: data.id,
            org_id: org.id,
            submitted_by: userId,
            status: 'pending'
          }));
          
          const { error: claimsError } = await supabase
            .from('project_organization_claims')
            .insert(projectOrgClaims);
          
          if (claimsError) {
            console.error('Error creating project-organization claims:', claimsError);
            // Don't fail the entire request, just log the error
          }
        }
      }
      
      // Return the project with organizations (both approved and pending)
      const { data: projectWithOrgs, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_organizations(
            organizations(name)
          ),
          project_organization_claims(
            organizations(name),
            status
          )
        `)
        .eq('id', data.id)
        .single();

      if (fetchError) {
        console.error('Error fetching project with organizations:', fetchError);
        return NextResponse.json(data, { status: 201 });
      }

      // Show approved organizations and pending claims separately
      const approvedOrgs = projectWithOrgs.project_organizations?.map((po: { organizations?: { name: string } }) => po.organizations?.name).filter(Boolean) || [];
      const pendingOrgs = projectWithOrgs.project_organization_claims?.filter((claim: { status: string }) => claim.status === 'pending')
        .map((claim: { organizations?: { name: string } }) => claim.organizations?.name).filter(Boolean) || [];

      const processedProject = {
        ...projectWithOrgs,
        organizations: approvedOrgs,
        pending_organizations: pendingOrgs
      };

      return NextResponse.json(processedProject, { status: 201 });
    } catch (error: any) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project: ' + error.message }, { status: 500 });
    }
  });
} 