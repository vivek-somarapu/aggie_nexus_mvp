import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, createEvent } from '@/lib/models/events';

export async function GET(request: NextRequest) {
  try {
    const events = await getAllEvents();
    
    // Format the events for the calendar component
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      start: event.start_time,
      end: event.end_time,
      location: event.location,
      color: event.color,
    }));
    
    return NextResponse.json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.start_time || !body.end_time || !body.created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, end_time, and created_by are required' },
        { status: 400 }
      );
    }
    
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
    };
    
    return NextResponse.json(formattedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
} 