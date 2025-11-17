import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// POST /api/organizations/[id]/inquiries - Submit an inquiry to an organization
export async function POST(
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
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Verify the organization exists
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
    
    // Parse request body
    const body = await request.json();
    const { note, preferred_contact } = body;
    
    if (!note || !note.trim()) {
      return NextResponse.json({ 
        error: 'Note is required' 
      }, { status: 400 });
    }
    
    // Fetch all managers for this organization
    const { data: managers, error: managersError } = await supabase
      .from('organization_managers')
      .select('user_id')
      .eq('org_id', id);
    
    if (managersError) {
      console.error('Error fetching organization managers:', managersError);
      return NextResponse.json({ 
        error: 'Failed to fetch organization managers',
        details: managersError.message 
      }, { status: 500 });
    }
    
    if (!managers || managers.length === 0) {
      return NextResponse.json({ 
        error: 'This organization has no managers to contact' 
      }, { status: 400 });
    }
    
    // Get user info for the message
    const { data: userInfo } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single();
    
    // Format the inquiry message with preferred contact info
    const inquiryMessage = `Organization Inquiry for ${orgData.name}\n\n` +
      `From: ${userInfo?.full_name || user.email}\n` +
      (preferred_contact ? `Preferred Contact: ${preferred_contact}\n\n` : '\n') +
      `Message:\n${note.trim()}`;
    
    // Send message to all managers
    const managerIds = managers.map(m => m.user_id);
    const messagePromises = managerIds.map((managerId) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('messages') as any).insert({
        sender_id: user.id,
        recipient_id: managerId,
        content: inquiryMessage,
        status: 'unread'
      })
    );
    
    const messageResults = await Promise.all(messagePromises);
    const errors = messageResults.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Some messages failed to send:', errors);
      // Still return success if at least one message was sent
      if (errors.length === messageResults.length) {
        return NextResponse.json({ 
          error: 'Failed to send inquiry to managers',
          details: errors[0].error?.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Inquiry sent to ${messageResults.length - errors.length} manager(s)`,
      sentTo: messageResults.length - errors.length,
      totalManagers: managerIds.length
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Organization inquiry POST API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

