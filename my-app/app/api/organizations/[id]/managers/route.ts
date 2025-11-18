import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET /api/organizations/[id]/managers - Get all managers for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // First verify the organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', id)
      .single();
    
    if (orgError || !orgData) {
      return NextResponse.json({ 
        error: 'Organization not found' 
      }, { status: 404 });
    }
    
    // First get user IDs from organization_managers join table
    // Use service role client to bypass RLS restrictions on the join table
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: orgManagers, error: orgManagersError } = await serviceClient
      .from('organization_managers')
      .select('user_id')
      .eq('org_id', id);
    
    if (orgManagersError) {
      console.error('Error fetching organization managers:', orgManagersError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization managers',
        details: orgManagersError.message 
      }, { status: 500 });
    }
    
    const managerIds = (orgManagers || []).map((om: { user_id: string }) => om.user_id);
    
    if (managerIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Now fetch managers by IDs (this respects the public users RLS policy)
    const { data: managers, error: managersError } = await supabase
      .from('users')
      .select('id, full_name, avatar, email, bio, is_texas_am_affiliate')
      .in('id', managerIds)
      .eq('deleted', false)
      .order('full_name');
    
    if (managersError) {
      console.error('Error fetching organization managers:', managersError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization managers',
        details: managersError.message 
      }, { status: 500 });
    }
    
    // Process managers to extract only user data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedManagers = (managers || []).map((manager: any) => ({
      id: manager.id,
      full_name: manager.full_name,
      avatar: manager.avatar,
      email: manager.email,
      bio: manager.bio,
      is_texas_am_affiliate: manager.is_texas_am_affiliate
    }));
    
    return NextResponse.json(processedManagers);
  } catch (error: unknown) {
    console.error('Organization managers GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

