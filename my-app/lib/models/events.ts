// lib/models/events.ts
import { query } from "../db";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_time: string; // ISO
  end_time: string; // ISO
  location: string | null;
  is_virtual: boolean;
  link: string | null;
  event_type: string; // must match your EventType enum
  poster_url: string | null;
  organizer_id: string; // who created it
  attendees: string[] | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

/** ─────────── READ ─────────── */

export async function getAllEvents(): Promise<Event[]> {
  const result = await query(
    `SELECT * 
     FROM events 
     ORDER BY start_time`
  );
  return result.rows;
}

export async function getEventsByStatus(
  status: "pending" | "approved" | "rejected"
): Promise<Event[]> {
  const result = await query(
    `SELECT * 
     FROM events 
     WHERE status = $1 
     ORDER BY start_time`,
    [status]
  );
  return result.rows;
}

export async function getApprovedEvents(): Promise<Event[]> {
  return getEventsByStatus("approved");
}

export async function getPendingEvents(): Promise<Event[]> {
  return getEventsByStatus("pending");
}

export async function getRejectedEvents(): Promise<Event[]> {
  return getEventsByStatus("rejected");
}

export async function getEventById(id: string): Promise<Event | null> {
  const result = await query(
    `SELECT * 
     FROM events 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/** ────────── CREATE ────────── */

export async function createEvent(
  e: Omit<
    Event,
    | "id"
    | "created_at"
    | "updated_at"
    | "approved_by"
    | "approved_at"
    | "attendees"
  >
): Promise<Event> {
  const {
    title,
    description,
    start_time,
    end_time,
    location,
    is_virtual,
    link,
    event_type,
    poster_url,
    organizer_id, // ← your PK on profiles
    status = "pending",
  } = e;

  const result = await query(
    `INSERT INTO events (
       title,
       description,
       start_time,
       end_time,
       location,
       is_virtual,
       link,
       event_type,
       poster_url,
       organizer_id,
       status
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
     )
     RETURNING *`,
    [
      title,
      description,
      start_time,
      end_time,
      location,
      is_virtual,
      link,
      event_type,
      poster_url,
      organizer_id,
      status,
    ]
  );

  return result.rows[0];
}

/** ─────── UPDATE STATUS ─────── */

export async function updateEventStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  managerId?: string
): Promise<Event | null> {
  if (status === "approved" && managerId) {
    const result = await query(
      `UPDATE events SET
        status      = $1,
        approved_by = $2,
        approved_at = NOW(),
        updated_at  = NOW()
        WHERE id = $3
       RETURNING *`,
      [status, managerId, id]
    );
    return result.rows[0] ?? null;
  } else {
    const result = await query(
      `UPDATE events SET
        status      = $1,
        approved_by = NULL,
        approved_at = NULL,
        updated_at  = NOW()
        WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] ?? null;
  }
}

/** ───────── UPDATE ───────── */

export async function updateEvent(
  id: string,
  fields: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
): Promise<Event | null> {
  const sets: string[] = [];
  const vals: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    sets.push(`${key} = $${idx}`);
    vals.push(value);
    idx++;
  }

  if (sets.length === 0) {
    return getEventById(id);
  }

  // always bump updated_at
  sets.push(`updated_at = NOW()`);
  const sql = `
    UPDATE events
      SET ${sets.join(", ")}
    WHERE id = $${idx}
    RETURNING *`;
  vals.push(id);

  const result = await query(sql, vals);
  return result.rows[0] ?? null;
}

/** ───────── DELETE ───────── */

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM events WHERE id = $1 RETURNING id`, [
    id,
  ]);
  return result.rowCount > 0;
}
