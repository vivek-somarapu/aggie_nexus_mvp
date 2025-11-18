import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET /api/organizations/[id]/members - Get all members for an organization
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
    
    // First get user IDs from organization_members join table
    // Use service role client to bypass RLS restrictions on the join table
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: orgMembers, error: orgMembersError } = await serviceClient
      .from('organization_members')
      .select('user_id')
      .eq('org_id', id);
    
    if (orgMembersError) {
      console.error('Error fetching organization members:', orgMembersError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization members',
        details: orgMembersError.message 
      }, { status: 500 });
    }
    
    const userIds = (orgMembers || []).map((om: { user_id: string }) => om.user_id);
    
    if (userIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Now fetch users by IDs (this respects the public users RLS policy)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, full_name, avatar, email, bio, industry')
      .in('id', userIds)
      .eq('deleted', false)
      .order('full_name');
    
    if (membersError) {
      console.error('Error fetching organization members:', membersError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization members',
        details: membersError.message 
      }, { status: 500 });
    }
    
    // Process members to extract only user data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedMembers = (members || []).map((member: any) => ({
      id: member.id,
      full_name: member.full_name,
      avatar: member.avatar,
      email: member.email,
      bio: member.bio,
      industry: member.industry || []
    }));
    
    return NextResponse.json(processedMembers);
  } catch (error: unknown) {
    console.error('Organization members GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

