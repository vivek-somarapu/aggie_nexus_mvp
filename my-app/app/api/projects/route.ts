import { NextRequest, NextResponse } from "next/server";
import { getAllProjects, createProject, searchProjects, filterProjectsBySkill } from "@/lib/models/projects";

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
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.owner_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, and owner_id are required' },
        { status: 400 }
      );
    }
    
    const project = await createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 