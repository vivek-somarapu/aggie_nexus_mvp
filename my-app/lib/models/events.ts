import { createClient } from '@/lib/supabase/server';

export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  event_type: 'workshop' | 'info_session' | 'networking' | 'hackathon' | 'deadline' | 'meeting' | 'other' | 'personal';
  poster_url?: string | null;
};

type EventWithCreator = Event & {
  creator: { full_name: string; avatar: string | null } | null;
};

// Helper function to get Supabase client
const getSupabase = async () => {
  return await createClient();
};

/** ─────────── READ ─────────── */
export async function getAllEvents(): Promise<Event[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_time');
  
  if (error) throw error;
  return data || [];
}

export async function getEventsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Event[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', status)
    .order('start_time');
  
  if (error) throw error;
  return data || [];
}

export const getApprovedEvents = () => getEventsByStatus("approved");
export const getPendingEvents = () => getEventsByStatus("pending");
export const getRejectedEvents = () => getEventsByStatus("rejected");

export async function getEventById(id: string): Promise<Event | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data;
}

export async function getEventWithCreatorById(id: string): Promise<EventWithCreator | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
        id, title, description, start_time, end_time, location,
        event_type, poster_url, created_by, status,
        approved_by, approved_at, created_at, updated_at,
        creator:users!events_created_by_fkey ( full_name, avatar )
      `
    )
    .eq("id", id)
    .maybeSingle<EventWithCreator>();

  if (error) throw error;
  return data;
}

/** ────────── CREATE ────────── */
export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'>): Promise<Event> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: eventData.title,
      description: eventData.description,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      location: eventData.location,
      created_by: eventData.created_by,
      status: eventData.status || 'pending',
      event_type: eventData.event_type || 'other',
      poster_url: eventData.poster_url
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/** ─────── UPDATE STATUS ─────── */
export async function updateEventStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  managerId?: string
): Promise<Event | null> {
  const supabase = await getSupabase();
  
  let updateData: any = { status };
  
  if (status === 'approved' && managerId) {
    // For approved events, set the approver and timestamp
    updateData.approved_by = managerId;
    updateData.approved_at = new Date().toISOString();
  } else {
    // For other status changes, clear approver info
    updateData.approved_by = null;
    updateData.approved_at = null;
  }
  
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data;
}

/** ───────── UPDATE ───────── */
export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
  const supabase = await getSupabase();
  
  // Filter out fields we don't want to update directly
  const { id: _, created_at, updated_at, approved_by, approved_at, ...updateData } = eventData as any;
  
  const { data, error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data;
}

/** ───────── DELETE ───────── */
export async function deleteEvent(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .select('id');
  
  if (error) throw error;
  return data && data.length > 0;
}

// RELATIONSHIP QUERIES - Leverage Supabase's join capabilities
export async function getEventsWithCreators(): Promise<(Event & { creator: { id: string; full_name: string; email: string } })[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:users!events_created_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('start_time');
  
  if (error) throw error;
  return data || [];
}

export async function getEventsWithApprovers(): Promise<(Event & { 
  creator: { id: string; full_name: string; email: string };
  approver?: { id: string; full_name: string; email: string } | null;
})[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      creator:users!events_created_by_fkey (
        id,
        full_name,
        email
      ),
      approver:users!events_approved_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('start_time');
  
  if (error) throw error;
  return data || [];
}
