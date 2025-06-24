// app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
// import { getEventById, updateEvent, deleteEvent } from "@/lib/models/events";
import { getEventWithCreatorById } from "@/lib/models/events";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ev = await getEventWithCreatorById(params.id);
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
