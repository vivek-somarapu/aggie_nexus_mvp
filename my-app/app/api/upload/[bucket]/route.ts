// app/api/upload/[bucket]/route.ts
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/auth-middleware";
import { NextRequest } from "next/server";

/*───────────────────────────────────────────────────────────
  POST /api/upload/[bucket]
  Body: multipart/form-data   field "file"
  Resp: { publicUrl: string }
───────────────────────────────────────────────────────────*/
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  return withAuth(request, async (userId, req) => {
    try {
      const { bucket } = await params;
      
      // Validate bucket name
      if (!["avatars", "resumes", "project-images"].includes(bucket)) {
        return NextResponse.json(
          { error: "Invalid bucket name" },
          { status: 400 }
        );
      }

      const supabase = createClient();

      // Parse multipart/form-data
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const ext = file.name.split(".").pop();
      const filename = `${uuid()}.${ext}`;

      // Upload (acting as the authenticated user from cookies)
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, Buffer.from(await file.arrayBuffer()), {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Return the public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
      return NextResponse.json({ publicUrl: data.publicUrl });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}

/*───────────────────────────────────────────────────────────
  DELETE /api/upload/[bucket]
  Body: JSON { url: "<Public URL previously returned>" }
  Resp: { ok: true }
───────────────────────────────────────────────────────────*/
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  return withAuth(request, async (userId, req) => {
    try {
      const { bucket } = await params;
      const { url } = (await req.json()) as { url?: string };
      const supabase = createClient();

      if (!url) {
        return NextResponse.json({ error: "No url supplied" }, { status: 400 });
      }

      const { pathname } = new URL(url);
      const parts = pathname.split(`/public/${bucket}/`);
      if (parts.length < 2) {
        return NextResponse.json({ error: "Invalid url" }, { status: 400 });
      }
      const filePath = parts[1];

      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  });
}
