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
  event_type: EventType;
  poster_url?: string | null;
  created_by: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  status?: "pending" | "approved" | "rejected";
  approved_by?: string | null;
  approved_at?: string | null;
}

const BASE = "/api/events";

async function parseJSON<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const eventService = {
  /** fetch public events (only approved) */
  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${BASE}?status=approved`);
    return parseJSON<Event[]>(res);
  },

  /** manager view: fetch by any status */
  async getEventsByStatus(
    status: "pending" | "approved" | "rejected"
  ): Promise<Event[]> {
    const res = await fetch(`${BASE}?status=${status}`);
    return parseJSON<Event[]>(res);
  },

  /** fetch one by id */
  async getEvent(id: string): Promise<Event | null> {
    const res = await fetch(`${BASE}/${id}`);
    if (res.status === 404) return null;
    return parseJSON<Event>(res);
  },

  /** create new event */
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
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "pending" }),
    });
    return parseJSON<Event>(res);
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
        | "event_type"
        | "poster_url"
      >
    >
  ): Promise<Event | null> {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await res.text());
    return parseJSON<Event>(res);
  },

  /** change status (manager only) */
  async updateEventStatus(
    id: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<Event | null> {
    const res = await fetch(`${BASE}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await res.text());
    return parseJSON<Event>(res);
  },

  /** delete event */
  async deleteEvent(id: string): Promise<boolean> {
    const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
    return res.ok;
  },
};
