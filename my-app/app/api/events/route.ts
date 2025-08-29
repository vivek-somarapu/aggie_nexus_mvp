// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEventsByStatus } from "@/lib/models/events";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/auth-middleware";
import type { EventType } from "@/lib/services/event-service";

export async function GET(request: NextRequest) {
  // 1) parse & validate status query
  const raw = request.nextUrl.searchParams.get("status")?.trim().toLowerCase();
  const creator = request.nextUrl.searchParams.get("creator");
  const valid = ["pending", "approved", "rejected"] as const;
  const status: "pending" | "approved" | "rejected" = valid.includes(raw as any)
    ? (raw as any)
    : "approved";

  // 2) if they asked for non-approved, enforce manager role
  if (status !== "approved") {
    return withAuth(request, async (userId) => {
      // *** await here ***
      const supabase = await createClient();

      // lookup profile row
      const { data: profile, error: profErr } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (profErr || (profile?.role !== 'admin')) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // now that user is manager, fetch
      // If filtering by creator
      if (creator) {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", creator)
          .eq("status", status)
          .order("start_time", { ascending: true });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(
          data.map((e) => ({
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
          }))
        );
      }

      const events = await getEventsByStatus(status);
      return NextResponse.json(
        events.map((e) => ({
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
        }))
      );
    });
  }

  // 3) otherwise public GET for approved
  // If filtering by creator
  if (creator) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", creator)
      .eq("status", status)
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data.map((e) => ({
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
      }))
    );
  }

  const events = await getEventsByStatus(status);
  return NextResponse.json(
    events.map((e) => ({
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
    }))
  );
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, req) => {
    // *** await here as well ***
    const supabase = await createClient();
    const body = await req.json();

    // assemble insert payload
    const toInsert = {
      title: body.title,
      description: body.description ?? null,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location ?? null,
      event_type: body.event_type as EventType,
      poster_url: body.poster_url ?? null,
      created_by: userId,
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

    // return exactly the same shape you had
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
  });
}
