// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
// import { getEventById, updateEvent, deleteEvent } from "@/lib/models/events";
import { getEventWithCreatorById } from "@/lib/models/events";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ev = await getEventWithCreatorById(id);
    if (!ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(ev);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
