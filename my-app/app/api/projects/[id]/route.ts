import { NextRequest, NextResponse } from "next/server";
import {
  getProjectById,
  updateProject,
  deleteProject,
  incrementProjectViews,
  getProjectWithMembersById,
} from "@/lib/models/projects";
import { withAuth } from "@/lib/auth-middleware";

// GET /api/projects/[id] - Get a single project with members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await getProjectWithMembersById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // fire-and-forget increment
    incrementProjectViews(id).catch(console.error);

    // finally return the enriched project
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
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
      console.error("Error updating project:", error);
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
          { error: "You don't have permission to delete this project" },
          { status: 403 }
        );
      }

      const success = await deleteProject(id);

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }
  });
}
