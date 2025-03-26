import { query } from '../db';

export type Event = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export async function getAllEvents(): Promise<Event[]> {
  const result = await query('SELECT * FROM events ORDER BY start_time');
  return result.rows;
}

export async function getEventById(id: string): Promise<Event | null> {
  const result = await query('SELECT * FROM events WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

export async function createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  const {
    title,
    description,
    start_time,
    end_time,
    location,
    color,
    created_by
  } = eventData;

  const result = await query(
    `INSERT INTO events (
      title, description, start_time, end_time, location, color, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      title,
      description,
      start_time,
      end_time,
      location,
      color,
      created_by
    ]
  );

  return result.rows[0];
}

export async function updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
  // Build query dynamically based on provided fields
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  Object.entries(eventData).forEach(([key, value]) => {
    // Skip id, created_at, updated_at
    if (['id', 'created_at', 'updated_at'].includes(key)) {
      return;
    }
    
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });
  
  if (fields.length === 0) {
    // Nothing to update
    return getEventById(id);
  }
  
  // Always update updated_at timestamp
  fields.push(`updated_at = NOW()`);
  
  values.push(id); // Add id as the last parameter
  
  const result = await query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

export async function deleteEvent(id: string): Promise<boolean> {
  const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
} 