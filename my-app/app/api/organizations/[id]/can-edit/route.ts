import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/organizations/[id]/can-edit - Check if user can edit this organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        canEdit: false,
        reason: 'Unauthorized'
      }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = userData?.role === 'admin';
    
    // If admin, can edit
    if (isAdmin) {
      return NextResponse.json({ 
        canEdit: true,
        reason: 'admin'
      });
    }
    
    // Check if user is a manager of this organization
    const { data: managerData } = await supabase
      .from('organization_managers')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', id)
      .single();
    
    if (managerData) {
      return NextResponse.json({ 
        canEdit: true,
        reason: 'manager'
      });
    }
    
    return NextResponse.json({ 
      canEdit: false,
      reason: 'not_manager'
    });
  } catch (error: unknown) {
    console.error('Organization can-edit GET API error:', error);
    return NextResponse.json({ 
      canEdit: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

