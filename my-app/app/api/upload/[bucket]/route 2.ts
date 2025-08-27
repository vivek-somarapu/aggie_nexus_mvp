// app/api/upload/[bucket]/route.ts
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { createClient as createStorageClient } from "@supabase/supabase-js";
import { withAuth } from "@/lib/auth-middleware";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const ALLOWED = ["avatars", "resumes", "project-images", "event-posters"];
const storage = createStorageClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  return withAuth(request, async (_userId, req) => {
    try {
      const { bucket } = await params;
      if (!ALLOWED.includes(bucket)) {
        return NextResponse.json(
          { error: "Invalid bucket name" },
          { status: 400 }
        );
      }

      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() || "";
      const filename = `${uuid()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      // Upload to Supabase Storage
      const { error: uploadError } = await storage.storage
        .from(bucket)
        .upload(filename, arrayBuffer, {
          upsert: false,
          cacheControl: "3600",
          contentType: file.type,
        });

      if (uploadError) {
        console.error("❌ supabase.storage.upload error:", uploadError);
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData, error: urlError } = storage.storage
        .from(bucket)
        .getPublicUrl(filename);

      if (urlError) {
        console.error("❌ getPublicUrl error:", urlError);
        return NextResponse.json({ error: urlError.message }, { status: 500 });
      }

      return NextResponse.json({ publicUrl: urlData.publicUrl });
    } catch (err) {
      console.error("❌ upload handler threw:", err);
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  return withAuth(request, async (_userId, req) => {
    try {
      const { bucket } = await params;
      const { url } = (await req.json()) as { url?: string };
      if (!url) {
        return NextResponse.json({ error: "No url supplied" }, { status: 400 });
      }

      const { pathname } = new URL(url);
      const parts = pathname.split(`/public/${bucket}/`);
      if (parts.length < 2) {
        return NextResponse.json({ error: "Invalid url" }, { status: 400 });
      }
      const filePath = parts[1];

      const { error: removeError } = await storage.storage
        .from(bucket)
        .remove([filePath]);

      if (removeError) {
        console.error("❌ supabase.storage.remove error:", removeError);
        return NextResponse.json(
          { error: removeError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("❌ delete handler threw:", err);
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  });
}
