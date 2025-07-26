// app/api/rsvps/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
};

/* ----------  POST /api/rsvps  ---------- */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    // 💡 basic validation
    if (!body.eventId || !body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "eventId, name and email are required" },
        { status: 400 }
      );
    }

    /* ▾▾▾  ONLY include columns that exist in the table  ▾▾▾ */
    const insertRow = {
      event_id: body.eventId,
      participant_name: body.name,
      participant_email: body.email,
      notes: body.notes ?? null,
      user_id: body.userId ?? null,
    };

    const { data, error } = await supabase
      .from("rsvps")
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already RSVPed to this event" },
          { status: 409 }
        );
      }
      console.error("[RSVP] insert error", error);
      return NextResponse.json(
        { error: "Database error: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        eventId: data.event_id,
        name: data.participant_name,
        email: data.participant_email,
        notes: data.notes,
        status: data.status,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[RSVP] fatal", err);
    return NextResponse.json(
      { error: "Unexpected error: " + err.message },
      { status: 500 }
    );
  }
}

/* ----------  GET /api/rsvps?eventId=  ---------- */
/* event organiser view – returns array of RSVPs for an event               */
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId query param is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .eq("event_id", eventId);

  if (error) {
    console.error("[RSVP] fetch error", error);
    return NextResponse.json(
      { error: "Database error: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    data.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      name: r.participant_name,
      email: r.participant_email,
      phone: r.phone,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    }))
  );
}
