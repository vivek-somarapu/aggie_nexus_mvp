/* lib/services/event-services.ts */
export type EventType =
  | "workshop"
  | "info_session"
  | "networking"
  | "hackathon"
  | "deadline"
  | "meeting"
  | "other"
  | "personal";

export const categories: Record<EventType, string> = {
  workshop: "Workshops",
  info_session: "Info Sessions",
  networking: "Networking Events",
  hackathon: "Hackathons",
  deadline: "Project Deadlines",
  meeting: "Meetings",
  other: "Other Events",
  personal: "Personal Events",
};

export interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string; // ISO
  end_time: string; // ISO
  location: string;
  is_virtual: boolean;
  event_link?: string;

  /** NEW */
  event_type: EventType;
  poster_url?: string; // storage URL or null

  organizer_id: string;
  attendees?: string[];

  created_at: string;
  updated_at: string;

  status?: "pending" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
}

const BASE = "/api/events";

async function parseJSON<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const eventService = {
  /** fetch public, approved events */
  async getEvents(): Promise<Event[]> {
    const r = await fetch(`${BASE}?status=approved`);
    return parseJSON<Event[]>(r);
  },

  /** manager view: fetch by status */
  async getEventsByStatus(
    status: "pending" | "approved" | "rejected"
  ): Promise<Event[]> {
    const r = await fetch(`${BASE}?status=${status}`);
    return parseJSON<Event[]>(r);
  },

  /** fetch one by id */
  async getEvent(id: string): Promise<Event | null> {
    const r = await fetch(`${BASE}/${id}`);
    if (r.status === 404) return null;
    return parseJSON<Event>(r);
  },

  /** create new event (poster_url must already be uploaded separately) */
  async createEvent(
    data: Omit<
      Event,
      | "id"
      | "created_at"
      | "updated_at"
      | "approved_by"
      | "approved_at"
      | "status"
    >
  ): Promise<Event> {
    const r = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "pending" }),
    });
    return parseJSON<Event>(r);
  },

  /** update core fields */
  async updateEvent(
    id: string,
    data: Partial<
      Pick<
        Event,
        | "title"
        | "description"
        | "start_time"
        | "end_time"
        | "location"
        | "is_virtual"
        | "event_link"
        | "event_type"
        | "poster_url"
      >
    >
  ): Promise<Event | null> {
    const r = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(await r.text());
    return parseJSON<Event>(r);
  },

  /** change status (manager only) */
  async updateEventStatus(
    id: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<Event | null> {
    const r = await fetch(`${BASE}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(await r.text());
    return parseJSON<Event>(r);
  },

  /** delete event */
  async deleteEvent(id: string): Promise<boolean> {
    const r = await fetch(`${BASE}/${id}`, { method: "DELETE" });
    return r.ok;
  },
};
