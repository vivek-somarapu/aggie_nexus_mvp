// lib/services/rsvp-service.ts
export interface RSVPData {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  userId?: string;
}

export interface RSVPResponse {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: "confirmed";
  createdAt: string;
}

export const rsvpService = {
  async submitRSVP(data: RSVPData): Promise<RSVPResponse> {
    const res = await fetch("/api/rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? "Failed to RSVP");
    }

    return res.json();
  },
};
