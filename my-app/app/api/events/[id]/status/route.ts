import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a manager
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_manager')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Failed to verify permissions" },
        { status: 500 }
      );
    }

    if (!profile.is_manager) {
      return NextResponse.json(
        { error: "Only managers can approve or reject events" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    
    if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'pending', 'approved', or 'rejected'" },
        { status: 400 }
      );
    }

    // Call RPC function for updating event status
    const { data, error } = await supabase.rpc('update_event_status', {
      event_id: id,
      new_status: body.status,
      manager_id: user.id
    });

    if (error) {
      console.error("Error updating event status:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get updated event
    const { data: updatedEvent, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError) {
      console.error("Error fetching updated event:", eventError);
      return NextResponse.json(
        { error: "Event status updated, but failed to fetch the updated event" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
