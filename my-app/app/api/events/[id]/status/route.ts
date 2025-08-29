import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth-middleware";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (userId, req) => {
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
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Failed to verify permissions" },
          { status: 500 }
        );
      }

      if (profile.role !== 'admin') {
        return NextResponse.json(
          { error: "Only managers can approve or reject events" },
          { status: 403 }
        );
      }

      // Get request body
      const body = await req.json();
      
      if (!body.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status value. Must be 'pending', 'approved', or 'rejected'" },
          { status: 400 }
        );
      }

      // Try to update event status directly
      const { data, error } = await supabase
        .from('events')
        .update({ 
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Error updating event status:", error);
        
        // If the error is about missing status column, we need to add it first
        if (error.message.includes('column "status" does not exist')) {
          // For now, return a helpful error message
          return NextResponse.json(
            { error: "Event status functionality requires database schema update. Please contact an administrator." },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json(data);
    } catch (error) {
      console.error("Unexpected error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}
