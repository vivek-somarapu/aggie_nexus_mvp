import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject, searchProjects, filterProjectsBySkill } from "@/lib/models/projects";
import { withAuth } from "@/lib/auth-middleware";

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const skill = searchParams.get('skill');
    
    let projects;
    
    if (searchTerm) {
      projects = await searchProjects(searchTerm);
    } else if (skill) {
      projects = await filterProjectsBySkill(skill);
    } else {
      projects = await getAllProjects();
    }
    
    return NextResponse.json(projects);
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
      
      const project = await createProject(projectData);
      return NextResponse.json(project, { status: 201 });
    } catch (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
  });
} 