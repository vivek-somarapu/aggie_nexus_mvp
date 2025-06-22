// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getApprovedEvents,
  getEventsByStatus,
  createEvent,
} from "@/lib/models/events";
import { createClient } from "@/lib/supabase/server";

import type { EventType } from "@/lib/services/event-service";

const allowedTypes: readonly EventType[] = [
  "workshop",
  "info_session",
  "networking",
  "hackathon",
  "deadline",
  "meeting",
  "other",
  "personal",
];

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") as
      | "pending"
      | "approved"
      | "rejected"
      | null;

    let events;
    if (status && status !== "approved") {
      // only managers can fetch non-approved
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_manager")
        .eq("id", user.id)
        .single();
      if (!profile?.is_manager)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      events = await getEventsByStatus(status);
    } else {
      // approved or default → approved
      events = await getApprovedEvents();
    }

    const formatted = events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      start: e.start_time,
      end: e.end_time,
      location: e.location,
      event_link: e.event_link,
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
  } catch (err) {
    console.error("Error fetching events:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ─── AUTH CHECK ──────────────────────────────────────
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ─── PARSE & VALIDATE BODY ───────────────────────────
    const body = await request.json();
    for (const field of ["title", "start_time", "end_time", "event_type"]) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    if (!allowedTypes.includes(body.event_type)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 }
      );
    }

    // ─── INSERT ──────────────────────────────────────────
    const toInsert = {
      title: body.title,
      description: body.description ?? null,
      start_time: body.start_time,
      end_time: body.end_time,
      location: body.location ?? null,
      event_link: body.event_link ?? null,
      event_type: body.event_type as EventType,
      poster_url: body.poster_url ?? null,
      created_by: user.id,
      status: "pending" as const,
    };
    const ev = await createEvent(toInsert);

    // ─── FORMAT RESPONSE ─────────────────────────────────
    return NextResponse.json(
      {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        start: ev.start_time,
        end: ev.end_time,
        location: ev.location,
        event_link: ev.event_link,
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
  } catch (err) {
    console.error("Error creating event:", err);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
