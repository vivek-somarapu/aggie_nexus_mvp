export type Event = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer_id: string;
  event_type: string;
  is_virtual: boolean;
  link?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
};

export const eventService = {
  // Get all events
  getEvents: async (): Promise<Event[]> => {
    const response = await fetch('/api/events');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get an event by ID
  getEvent: async (id: string): Promise<Event | null> => {
    const response = await fetch(`/api/events/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create a new event
  createEvent: async (eventData: Omit<Event, "id" | "created_at" | "updated_at">): Promise<Event> => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Update an existing event
  updateEvent: async (id: string, eventData: Partial<Event>): Promise<Event | null> => {
    const response = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete an event
  deleteEvent: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  },
}; 