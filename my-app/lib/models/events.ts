import { supabase } from "../db";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
  location: string | null;
  event_type: string; // must match EventType enum
  poster_url: string | null;
  created_by: string;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

/** ─────────── READ ─────────── */
export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: false });
  if (error) throw error;
  return (data as Event[]) || [];
}

export async function getEventsByStatus(
  status: "pending" | "approved" | "rejected"
): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", status)
    .order("start_time", { ascending: false });
  if (error) throw error;
  return (data as Event[]) || [];
}

export const getApprovedEvents = () => getEventsByStatus("approved");
export const getPendingEvents = () => getEventsByStatus("pending");
export const getRejectedEvents = () => getEventsByStatus("rejected");

export async function getEventWithCreatorById(
  id: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*, profiles!created_by(*)") // assumes a profiles table keyed by id
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Event;
}

/** ────────── CREATE ────────── */
export async function createEvent(
  e: Omit<
    Event,
    "id" | "created_at" | "updated_at" | "approved_by" | "approved_at"
  >
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert(e)
    .select("*")
    .single();
  if (error) throw error;
  return data as Event;
}

/** ─────── UPDATE STATUS ─────── */
export async function updateEventStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  managerId?: string
): Promise<Event | null> {
  const updateFields: Partial<Event> = { status };
  if (status === "approved") {
    updateFields.approved_by = managerId ?? null;
    updateFields.approved_at = new Date().toISOString();
  } else {
    updateFields.approved_by = null;
    updateFields.approved_at = null;
  }
  const { data, error } = await supabase
    .from("events")
    .update(updateFields)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Event;
}

/** ───────── UPDATE ───────── */
export async function updateEvent(
  id: string,
  fields: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Event;
}

/** ───────── DELETE ───────── */
export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
  return true;
}
