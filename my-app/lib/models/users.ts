import { query, withTransaction } from '../db';

export type User = {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  industry: string[];
  skills: string[];
  linkedin_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  additional_links: Array<{ title: string; url: string }>;
  contact: { email: string; phone?: string };
  views: number;
  graduation_year: number | null;
  is_texas_am_affiliate: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

// CREATE
export async function createUser(userData: Omit<User, 'id' | 'views' | 'created_at' | 'updated_at'>): Promise<User> {
  const {
    full_name,
    email,
    bio,
    industry,
    skills,
    linkedin_url,
    website_url,
    resume_url,
    additional_links,
    contact,
    graduation_year,
    is_texas_am_affiliate,
    avatar,
  } = userData;

  const result = await query(
    `INSERT INTO users (
      full_name, email, bio, industry, skills, linkedin_url, website_url, 
      resume_url, additional_links, contact, graduation_year, is_texas_am_affiliate, avatar
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
    RETURNING *`,
    [
      full_name,
      email,
      bio,
      industry,
      skills,
      linkedin_url,
      website_url,
      resume_url,
      JSON.stringify(additional_links || []),
      JSON.stringify(contact || {}),
      graduation_year,
      is_texas_am_affiliate,
      avatar,
    ]
  );

  return result.rows[0];
}

// READ
export async function getAllUsers(): Promise<User[]> {
  const result = await query('SELECT * FROM users ORDER BY full_name');
  
  return result.rows.map(row => ({
    ...row,
    additional_links: row.additional_links || [],
    contact: row.contact || {}
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  return {
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  return {
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  };
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const result = await query(
    `SELECT * FROM users 
     WHERE deleted != true 
     AND (full_name ILIKE $1 OR email ILIKE $1 OR bio ILIKE $1)
     ORDER BY full_name`,
    [`%${searchTerm}%`]
  );
  
  return result.rows.map(row => ({
    ...row,
    additional_links: row.additional_links || [],
    contact: row.contact || {}
  }));
}

export async function filterUsersBySkill(skill: string): Promise<User[]> {
  const result = await query(
    'SELECT * FROM users WHERE $1 = ANY(skills) ORDER BY full_name',
    [skill]
  );
  
  return result.rows.map(row => ({
    ...row,
    additional_links: row.additional_links || [],
    contact: row.contact || {}
  }));
}

// UPDATE
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  // Build query dynamically based on provided fields
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  Object.entries(userData).forEach(([key, value]) => {
    // Skip id, views, created_at, updated_at
    if (['id', 'views', 'created_at', 'updated_at'].includes(key)) {
      return;
    }
    
    // Handle special cases for JSON fields
    if (key === 'additional_links' || key === 'contact') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(JSON.stringify(value || {}));
      paramIndex++;
      return;
    }
    
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });
  
  if (fields.length === 0) {
    // Nothing to update
    return getUserById(id);
  }
  
  values.push(id); // Add id as the last parameter
  
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  return {
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {}
  };
}

export async function incrementUserViews(id: string): Promise<void> {
  await query('UPDATE users SET views = views + 1 WHERE id = $1', [id]);
}

// DELETE
export async function deleteUser(id: string): Promise<boolean> {
  // Use a transaction to delete user and their associated data
  return withTransaction(async (client) => {
    // Delete user bookmarks
    await client.query('DELETE FROM user_bookmarks WHERE user_id = $1 OR bookmarked_user_id = $1', [id]);
    
    // Delete project bookmarks
    await client.query('DELETE FROM project_bookmarks WHERE user_id = $1', [id]);
    
    // Delete user's projects or reassign them
    await client.query('DELETE FROM projects WHERE owner_id = $1', [id]);
    
    // Finally delete the user
    const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
    
    return result.rowCount > 0;
  });
}

// Add more functions as needed for searching, filtering, etc. 