import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/[id]/members - Get project members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_members")
      .select(
        `
        user_id,
        role,
        joined_at,
        user:users (
          id,
          full_name,
          avatar
        )
      `
      )
      .eq("project_id", id);

    if (error) {
      console.error("Error fetching project members:", error);
      return NextResponse.json(
        { error: "Failed to fetch project members" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET project members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add members to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId, req) => {
    try {
      const { id: projectId } = await params;
      const supabase = await createClient();
      const body = await req.json();

      // Validate request body
      if (!body.members || !Array.isArray(body.members)) {
        return NextResponse.json(
          { error: "Members array is required" },
          { status: 400 }
        );
      }

      // Check if user is project owner
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      if (projectError) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      if (project.owner_id !== userId) {
        return NextResponse.json(
          { error: "Only project owner can add members" },
          { status: 403 }
        );
      }

      // Prepare members data
      const membersData = body.members.map((member: any) => ({
        project_id: projectId,
        user_id: member.user_id,
        role: member.role,
      }));

      console.log("Adding members data:", membersData);

      // Insert members
      const { data, error } = await supabase
        .from("project_members")
        .insert(membersData)
        .select(
          `
          user_id,
          role,
          joined_at,
          user:users (
            id,
            full_name,
            avatar
          )
        `
        );

      if (error) {
        console.error("Error adding project members:", error);
        return NextResponse.json(
          {
            error: "Failed to add project members",
            details: error.message,
            code: error.code,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
      console.error("Error in POST project members:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/projects/[id]/members - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId, req) => {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get("user_id");

    if (!memberUserId) {
      return NextResponse.json(
        { error: "user_id parameter is required" },
        { status: 400 }
      );
    }

    // Check if user is project owner
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectError) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.owner_id !== userId) {
      return NextResponse.json(
        { error: "Only project owner can remove members" },
        { status: 403 }
      );
    }

    // Delete member
    // new code
    const { data: deletedRows, error } = await supabase
      .from("project_members")
      .delete()
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", memberUserId);

    if (error) {
      console.error("Error removing project member:", error);
      return NextResponse.json(
        { error: "Failed to remove project member", details: error.message },
        { status: 500 }
      );
    }

    console.log("Deleted rows:", deletedRows);

    if (!deletedRows || deletedRows.length === 0) {
      // nothing was removed — likely RLS blocking or wrong IDs
      return NextResponse.json(
        {
          error:
            "No member removed (either not found or you’re not authorized)",
          deletedCount: deletedRows.length,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedRows.length,
    });
  });
}
