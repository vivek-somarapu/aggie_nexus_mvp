import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, getApprovedEvents, getEventsByStatus, createEvent } from '@/lib/models/events';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    
    let events;
    
    // Check if user is authenticated and is a manager for non-approved events
    if (status && status !== 'approved') {
      const cookieStore = cookies();
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // If not authenticated or requesting non-approved events
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Check if user is a manager
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_manager')
        .eq('id', session.user.id)
        .single();
        
      if (!profile?.is_manager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // If user is authenticated and is a manager, fetch events by status
      events = await getEventsByStatus(status);
    } else if (status === 'approved') {
      // Everyone can see approved events
      events = await getApprovedEvents();
    } else {
      // Default to showing only approved events if no status is specified
      events = await getApprovedEvents();
    }
    
    // Format the events for the calendar component
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start_time,
      end: event.end_time,
      location: event.location,
      color: event.color,
      event_type: event.color || 'other', // Backward compatibility
      created_by: event.created_by,
      status: event.status,
      approved_by: event.approved_by,
      approved_at: event.approved_at,
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = cookies();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, and end_time are required' },
        { status: 400 }
      );
    }
    
    // Add the current user as the creator
    body.created_by = session.user.id;
    
    // Set initial status to pending
    body.status = 'pending';
    
    const event = await createEvent(body);
    
    // Format the response for the calendar component
    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start_time,
      end: event.end_time,
      location: event.location,
      color: event.color,
      event_type: event.color || 'other', // Backward compatibility
      created_by: event.created_by,
      status: event.status,
    };
    
    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
} 