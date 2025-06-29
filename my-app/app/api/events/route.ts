// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEventsByStatus } from "@/lib/models/events";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/services/event-service";

export async function GET(request: NextRequest) {
  // 1) clean & validate the incoming query string
  const raw = request.nextUrl.searchParams.get("status")?.trim().toLowerCase();
  const valid = ["pending", "approved", "rejected"] as const;
  const status: "pending" | "approved" | "rejected" = valid.includes(raw as any)
    ? (raw as any)
    : "approved";

  // 2) manager-gate *only* if asking for non-approved rows
  if (status !== "approved") {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_manager")
      .eq("id", user.id)
      .single();
    if (!profile?.is_manager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3) one call, one code-path
  const events = await getEventsByStatus(status);

  // 4) shape the response
  const formatted = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    start: e.start_time,
    end: e.end_time,
    location: e.location,
    event_type: e.event_type,
    poster_url: e.poster_url,
    created_by: e.created_by,
    status: e.status,
    approved_by: e.approved_by,
    approved_at: e.approved_at,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }));
  return NextResponse.json(formatted);
}

export async function POST(request: NextRequest) {
  // ─── AUTH CHECK ────────────────────────────────────
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ─── PARSE & VALIDATE BODY ─────────────────────────
  const body = await request.json();
  // … your field checks …

  // ─── INSERT VIA SUPABASE ───────────────────────────
  const toInsert = {
    title: body.title,
    description: body.description ?? null,
    start_time: body.start_time,
    end_time: body.end_time,
    location: body.location ?? null,
    event_type: body.event_type as EventType,
    poster_url: body.poster_url ?? null,
    created_by: user.id,
    status: "pending" as const,
  };

  const { data: ev, error } = await supabase
    .from("events")
    .insert(toInsert)
    .select("*")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ─── RETURN THE NEW ROW ────────────────────────────
  return NextResponse.json(
    {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start: ev.start_time,
      end: ev.end_time,
      location: ev.location,
      event_type: ev.event_type,
      poster_url: ev.poster_url,
      created_by: ev.created_by,
      status: ev.status,
      approved_by: ev.approved_by,
      approved_at: ev.approved_at,
      created_at: ev.created_at,
      updated_at: ev.updated_at,
    },
    { status: 201 }
  );
}
