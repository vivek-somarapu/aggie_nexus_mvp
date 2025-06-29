// lib/services/event-service.ts
//--------------------------------------------------------------
// Types
//--------------------------------------------------------------
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
  description: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
  location: string | null;
  event_type: EventType;
  poster_url: string | null;
  created_by: string;

  // denormalised creator (from /api/events/[id])
  creator?: { full_name: string; avatar: string | null };

  created_at: string;
  updated_at: string;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
}

//--------------------------------------------------------------
// Internals
//--------------------------------------------------------------
const BASE = "/api/events";

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: any };
    throw new Error(error || res.statusText);
  }
  return res.json() as Promise<T>;
}

//--------------------------------------------------------------
// Public service
//--------------------------------------------------------------
export const eventService = {
  //------------------------------------------------------------
  // CRUD
  //------------------------------------------------------------
  async getEvents(): Promise<Event[]> {
    return api<Event[]>(`${BASE}?status=approved`);
  },

  async getEventsByStatus(
    status: "pending" | "approved" | "rejected"
  ): Promise<Event[]> {
    return api<Event[]>(`${BASE}?status=${status}`);
  },

  async getEventsByCreator(
    creatorId: string,
    status: "pending" | "approved" | "rejected" = "approved"
  ): Promise<Event[]> {
    return api<Event[]>(
      `${BASE}?status=${status}&creator=${encodeURIComponent(creatorId)}`
    );
  },

  async getEvent(id: string): Promise<Event | null> {
    try {
      return await api<Event>(`${BASE}/${id}`);
    } catch (err) {
      if ((err as Error).message.includes("404")) return null;
      throw err;
    }
  },

  async createEvent(
    data: Omit<
      Event,
      | "id"
      | "created_at"
      | "updated_at"
      | "approved_at"
      | "approved_by"
      | "status"
    >
  ): Promise<Event> {
    return api<Event>(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: "pending" }),
    });
  },

  async updateEvent(
    id: string,
    fields: Partial<
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
    try {
      return await api<Event>(`${BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
    } catch (err) {
      if ((err as Error).message.includes("404")) return null;
      throw err;
    }
  },

  async updateEventStatus(
    id: string,
    status: "pending" | "approved" | "rejected"
  ): Promise<Event | null> {
    try {
      return await api<Event>(`${BASE}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      if ((err as Error).message.includes("404")) return null;
      throw err;
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    await api(`${BASE}/${id}`, { method: "DELETE" });
    return true;
  },

  //------------------------------------------------------------
  // Poster handling (bucket: event-posters)
  //------------------------------------------------------------
  async uploadPhoto(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/event-posters", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Poster upload failed");
    }
    return (await res.json()).publicUrl as string;
  },

  async deletePhoto(publicUrl: string): Promise<void> {
    await api("/api/upload/event-posters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });
  },
};
