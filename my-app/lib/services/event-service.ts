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
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
};

export const eventService = {
  // Get all events
  getEvents: async (): Promise<Event[]> => {
    const response = await fetch('/api/events?status=approved');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get events by status
  getEventsByStatus: async (status: 'pending' | 'approved' | 'rejected'): Promise<Event[]> => {
    const response = await fetch(`/api/events?status=${status}`);
    
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

  // Create a new event (automatically sets status to pending)
  createEvent: async (eventData: Omit<Event, "id" | "created_at" | "updated_at" | "status" | "approved_by" | "approved_at">): Promise<Event> => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...eventData, status: 'pending' }),
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

  // Update event status (for manager approval/rejection)
  updateEventStatus: async (id: string, status: 'pending' | 'approved' | 'rejected'): Promise<Event | null> => {
    const response = await fetch(`/api/events/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update event status: ${response.statusText}`);
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