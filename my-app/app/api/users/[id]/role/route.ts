import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("API route called");
    const { id } = await params;
    console.log("User ID to update:", id);
    
    // Log cookies for debugging
    const cookies = request.headers.get('cookie');
    console.log("Request cookies:", cookies);
    
    const supabase = await createClient();
    console.log("Supabase client created");

    // Get the current user to check if they're an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth result:", { user: user?.id, error: authError });
    
    if (authError) {
      console.log("Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.log("No user found in auth context");
      return NextResponse.json(
        { error: "No authenticated user" },
        { status: 401 }
      );
    }

    // Get the current user's profile to check their role
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log("Profile check result:", { currentUserProfile, profileError });

    if (profileError || !currentUserProfile) {
      console.log("Profile not found");
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only admins can update user roles
    if (currentUserProfile.role !== 'admin') {
      console.log("Insufficient permissions, user role:", currentUserProfile.role);
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    console.log("Admin permission confirmed");

    const body = await request.json();
    console.log("Request body:", body);
    
    if (!body.role || !['user', 'manager'].includes(body.role)) {
      console.log("Invalid role value:", body.role);
      return NextResponse.json(
        { error: "Invalid role value" },
        { status: 400 }
      );
    }

    console.log("Updating user", id, "to role:", body.role);
    
    // Update user role using service role client to bypass RLS
    console.log("Attempting to update user role in database...");
    
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await serviceSupabase
      .from('users')
      .update({ role: body.role })
      .eq('id', id)
      .select();

    console.log("Database update result:", { data, error });

    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error("No user found to update");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = data[0];
    console.log("User updated successfully:", updatedUser);

    // Handle organization managers if promoting to manager
    if (body.role === 'manager' && body.orgIds && body.orgIds.length > 0) {
      console.log('Adding user to organization managers:', body.orgIds);
      
      // First, check if user is already a manager of any of these organizations
      const { data: existingManagers, error: checkError } = await serviceSupabase
        .from('organization_managers')
        .select('org_id')
        .eq('user_id', id)
        .in('org_id', body.orgIds);

      if (checkError) {
        console.error("Error checking existing managers:", checkError);
      } else {
        console.log('Existing manager entries:', existingManagers);
      }

      // Filter out organizations where user is already a manager
      const existingOrgIds = existingManagers?.map(m => m.org_id) || [];
      const newOrgIds = body.orgIds.filter(orgId => !existingOrgIds.includes(orgId));
      
      console.log('New organizations to add user to:', newOrgIds);

      if (newOrgIds.length > 0) {
        const managerEntries = newOrgIds.map(orgId => ({
          org_id: orgId,
          user_id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log('Manager entries to insert:', managerEntries);

        const { data: orgData, error: orgError } = await serviceSupabase
          .from('organization_managers')
          .insert(managerEntries)
          .select();

        console.log('Organization manager insert result:', { orgData, orgError });

        if (orgError) {
          console.error("Error adding user to organization managers:", orgError);
          // Don't fail the entire operation, just log the error
        } else {
          console.log('Successfully added user to organization managers:', orgData);
        }
      } else {
        console.log('User is already a manager of all selected organizations');
      }
    }

    // Handle organization managers if demoting to user
    if (body.role === 'user') {
      const { error: removeError } = await serviceSupabase
        .from('organization_managers')
        .delete()
        .eq('user_id', id);

      if (removeError) {
        console.error("Error removing user from organization managers:", removeError);
      }
    }

    console.log("User role updated successfully:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 