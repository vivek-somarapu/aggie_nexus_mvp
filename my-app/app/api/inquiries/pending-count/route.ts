import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/inquiries/pending-count - Get count of pending inquiries for a user's projects
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        count: 0
      }, { status: 401 });
    }
    
    // Get projects owned by the user
    const { data: ownedProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', user.id);

    if (projectsError) {
      console.error('Error fetching owned projects:', projectsError);
      return NextResponse.json({ 
        error: 'Failed to fetch projects',
        count: 0
      }, { status: 500 });
    }

    if (!ownedProjects || ownedProjects.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const projectIds = ownedProjects.map(project => project.id);
    
    // Count pending inquiries for those projects that are unread (false or null)
    // Using separate queries for read_inquiry = false and read_inquiry IS NULL
    const { count: countFalse, error: errorFalse } = await supabase
      .from('project_applications')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'pending')
      .eq('read_inquiry', false);
    
    const { count: countNull, error: errorNull } = await supabase
      .from('project_applications')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'pending')
      .is('read_inquiry', null);
    
    if (errorFalse || errorNull) {
      console.error('Error counting pending inquiries:', errorFalse || errorNull);
      return NextResponse.json({ 
        error: 'Failed to count inquiries',
        count: 0
      }, { status: 500 });
    }
    
    const totalCount = (countFalse || 0) + (countNull || 0);
    
    return NextResponse.json({ count: totalCount });
  } catch (error: unknown) {
    console.error('Pending inquiries count GET API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      count: 0,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

