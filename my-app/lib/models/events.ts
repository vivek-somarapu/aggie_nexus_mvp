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
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
};

export async function getAllEvents(): Promise<Event[]> {
  const result = await query('SELECT * FROM events ORDER BY start_time');
  return result.rows;
}

export async function getEventsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<Event[]> {
  const result = await query('SELECT * FROM events WHERE status = $1 ORDER BY start_time', [status]);
  return result.rows;
}

export async function getApprovedEvents(): Promise<Event[]> {
  return getEventsByStatus('approved');
}

export async function getPendingEvents(): Promise<Event[]> {
  return getEventsByStatus('pending');
}

export async function getRejectedEvents(): Promise<Event[]> {
  return getEventsByStatus('rejected');
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
    created_by,
    status = 'pending'
  } = eventData;

  const result = await query(
    `INSERT INTO events (
      title, description, start_time, end_time, location, color, created_by, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      title,
      description,
      start_time,
      end_time,
      location,
      color,
      created_by,
      status
    ]
  );

  return result.rows[0];
}

export async function updateEventStatus(
  id: string, 
  status: 'pending' | 'approved' | 'rejected', 
  managerId?: string
): Promise<Event | null> {
  // For approved events, we set the approver and timestamp
  if (status === 'approved' && managerId) {
    const result = await query(
      `UPDATE events SET 
        status = $1, 
        approved_by = $2, 
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $3 
      RETURNING *`,
      [status, managerId, id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } else {
    // For other status changes, we don't set approver info
    const result = await query(
      `UPDATE events SET 
        status = $1, 
        approved_by = NULL, 
        approved_at = NULL,
        updated_at = NOW()
      WHERE id = $2 
      RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
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