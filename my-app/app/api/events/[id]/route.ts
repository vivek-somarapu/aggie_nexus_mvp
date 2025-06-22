// import { NextRequest, NextResponse } from "next/server";
// import { getEventById, updateEvent, deleteEvent } from "@/lib/models/events";

// interface Params {
//   id: string;
// }

// export async function GET(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const id = params.id;
//     const event = await getEventById(id);

//     if (!event) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     // Format the response for the calendar component
//     const formattedEvent = {
//       id: event.id,
//       title: event.title,
//       description: event.description,
//       start: event.start_time,
//       end: event.end_time,
//       location: event.location,
//       color: event.color,
//     };

//     return NextResponse.json(formattedEvent);
//   } catch (error) {
//     console.error("Error fetching event:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch event" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const id = params.id;
//     const body = await request.json();

//     // Convert from calendar format to database format if needed
//     const dbFormatData = { ...body };
//     if (body.start) {
//       dbFormatData.start_time = body.start;
//       delete dbFormatData.start;
//     }
//     if (body.end) {
//       dbFormatData.end_time = body.end;
//       delete dbFormatData.end;
//     }

//     const updatedEvent = await updateEvent(id, dbFormatData);

//     if (!updatedEvent) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     // Format the response for the calendar component
//     const formattedEvent = {
//       id: updatedEvent.id,
//       title: updatedEvent.title,
//       description: updatedEvent.description,
//       start: updatedEvent.start_time,
//       end: updatedEvent.end_time,
//       location: updatedEvent.location,
//       color: updatedEvent.color,
//     };

//     return NextResponse.json(formattedEvent);
//   } catch (error) {
//     console.error("Error updating event:", error);
//     return NextResponse.json(
//       { error: "Failed to update event" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: NextRequest,
//   { params }: { params: Params }
// ) {
//   try {
//     const id = params.id;
//     const success = await deleteEvent(id);

//     if (!success) {
//       return NextResponse.json({ error: "Event not found" }, { status: 404 });
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting event:", error);
//     return NextResponse.json(
//       { error: "Failed to delete event" },
//       { status: 500 }
//     );
//   }
// }

// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getEventWithCreatorById } from "@/lib/models/events";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // 1. Fetch the event + creator info in one go
    const ev = await getEventWithCreatorById(id);

    // 2. Not found → 404
    if (!ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 3. Shape the response to match your front‐end Event interface
    const payload = {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start_time: ev.start_time,
      end_time: ev.end_time,
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
      creator: {
        full_name: ev.creator_full_name,
        avatar: ev.creator_avatar,
      },
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Error fetching event by ID:", err);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}
