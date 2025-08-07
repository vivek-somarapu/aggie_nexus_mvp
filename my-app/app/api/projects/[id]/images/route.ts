// app/api/projects/[id]/images/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { createClient } from "@/lib/supabase/server";

async function getSupabase() {
  return await createClient();
}

// GET  /api/projects/:id/images
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("project_images")
    .select("id, url, position, created_at")
    .eq("project_id", id)
    .order("position", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST /api/projects/:id/images
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, async (userId, innerReq) => {
    const { id: project_id } = await params;
    const body = await innerReq.json();
    console.log('POST /api/projects/:id/images - received:', { project_id, body, userId });
    
    const { url, position } = body as {
      url: string;
      position: number;
    };

    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("project_images")
      .insert({ project_id, url, position })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  });
}

// DELETE /api/projects/:id/images/:imageId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // we’ll send { imageId } in the JSON body
  return withAuth(req, async (_userId, innerReq) => {
    const { id: project_id } = await params;
    const { imageId } = (await innerReq.json()) as { imageId: string };

    const supabase = await getSupabase();
    const { error } = await supabase
      .from("project_images")
      .delete()
      .eq("id", imageId)
      .eq("project_id", project_id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  });
}
