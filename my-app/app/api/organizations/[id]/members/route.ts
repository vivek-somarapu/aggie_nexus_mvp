import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

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
    
    // Fetch members through organization_members join table
    // Query from users and filter by organization_members
    // Use explicit foreign key to avoid ambiguity (user_id relationship, not verified_by)
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar,
        email,
        bio,
        organization_members!organization_members_user_id_fkey!inner(org_id)
      `)
      .eq('organization_members.org_id', id)
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
      bio: member.bio
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

