import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject, deleteProject, incrementProjectViews } from "@/lib/models/projects";
import { withAuth } from "@/lib/auth-middleware";

// GET /api/projects/[id] - Get a single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectById(id);
    
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Increment view count asynchronously
    incrementProjectViews(id).catch(console.error);
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (userId, req) => {
    try {
      const { id } = await params;
      const body = await req.json();
      
      // Check if the user is the owner of the project
      const project = await getProjectById(id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      
      if (project.owner_id !== userId) {
        return NextResponse.json(
          { error: "You don't have permission to update this project" },
          { status: 403 }
        );
      }
      
      const updatedProject = await updateProject(id, body);
      
      return NextResponse.json(updatedProject);
    } catch (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (userId, req) => {
    try {
      const { id } = await params;
      const supabase = await import("@/lib/supabase/server").then(m => m.createClient());
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      // Get project
      const project = await getProjectById(id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      // Check if admin (role === 'admin')
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      const isAdmin = userProfile?.role === 'admin';
      // Admins can hard delete, owners can soft delete
      if (isAdmin) {
        const { hardDeleteProject } = await import("@/lib/models/projects");
        const success = await hardDeleteProject(id);
        return NextResponse.json({ success, admin: true });
      } else if (project.owner_id === userId) {
        const success = await deleteProject(id);
        return NextResponse.json({ success, admin: false });
      } else {
        return NextResponse.json(
          { error: "You don't have permission to delete this project" },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }
  });
}