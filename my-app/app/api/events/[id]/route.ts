// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
// import { getEventById, updateEvent, deleteEvent } from "@/lib/models/events";
import { getEventWithCreatorById } from "@/lib/models/events";
import { createClient } from "@/lib/supabase/server";


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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();

    // Check if the user owns the event 
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.created_by !== user.id) {
      return NextResponse.json({ error: "You don't have permission to edit this event" }, { status: 403 });
    }

    console.log("Updating event", id, "with pending changes");
    
    // Store the updated event data as pending changes
    // NOTE: We do NOT change the status - the event stays approved
    // Only the has_pending_changes flag is set to true
    const { data, error } = await supabase
      .from('events')
      .update({ 
        pending_changes: body,
        has_pending_changes: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error("Error updating event:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    console.log("Event pending changes updated successfully:", data);

    return NextResponse.json({ 
      success: true, 
      message: "Changes submitted for approval",
      event: data[0]
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
