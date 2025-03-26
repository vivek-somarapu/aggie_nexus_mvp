import { query, withTransaction } from '../db';

export type Project = {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  is_idea: boolean;
  recruitment_status: string;
  industry: string[];
  required_skills: string[];
  location_type: string;
  estimated_start: string | null;
  estimated_end: string | null;
  contact_info: { email: string; phone?: string };
  views: number;
  created_at: string;
  last_updated: string;
  project_status: string;
  deleted: boolean;
};

// CREATE
export async function createProject(projectData: Omit<Project, 'id' | 'views' | 'created_at' | 'last_updated' | 'deleted'>): Promise<Project> {
  const {
    title,
    description,
    owner_id,
    is_idea,
    recruitment_status,
    industry,
    required_skills,
    location_type,
    estimated_start,
    estimated_end,
    contact_info,
    project_status
  } = projectData;

  const result = await query(
    `INSERT INTO projects (
      title, description, owner_id, is_idea, recruitment_status, 
      industry, required_skills, location_type, estimated_start,
      estimated_end, contact_info, project_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      title,
      description,
      owner_id,
      is_idea,
      recruitment_status,
      industry,
      required_skills,
      location_type,
      estimated_start,
      estimated_end,
      JSON.stringify(contact_info || {}),
      project_status
    ]
  );

  return result.rows[0];
}

// READ
export async function getAllProjects(): Promise<Project[]> {
  const result = await query(
    'SELECT * FROM projects WHERE deleted != true ORDER BY created_at DESC'
  );
  
  return result.rows.map(row => ({
    ...row,
    contact_info: row.contact_info || {}
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const result = await query(
    'SELECT * FROM projects WHERE id = $1 AND deleted != true',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const project = result.rows[0];
  return {
    ...project,
    contact_info: project.contact_info || {}
  };
}

export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const result = await query(
    'SELECT * FROM projects WHERE owner_id = $1 AND deleted != true ORDER BY created_at DESC',
    [ownerId]
  );
  
  return result.rows.map(row => ({
    ...row,
    contact_info: row.contact_info || {}
  }));
}

export async function searchProjects(searchTerm: string, limit = 10): Promise<Project[]> {
  const result = await query(
    `SELECT * FROM projects 
     WHERE (title ILIKE $1 OR description ILIKE $1) AND deleted != true
     ORDER BY created_at DESC
     LIMIT $2`,
    [`%${searchTerm}%`, limit]
  );
  
  return result.rows.map(row => ({
    ...row,
    contact_info: row.contact_info || {}
  }));
}

export async function filterProjectsBySkill(skill: string): Promise<Project[]> {
  const result = await query(
    'SELECT * FROM projects WHERE $1 = ANY(required_skills) AND deleted != true ORDER BY created_at DESC',
    [skill]
  );
  
  return result.rows.map(row => ({
    ...row,
    contact_info: row.contact_info || {}
  }));
}

// UPDATE
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project | null> {
  // Build query dynamically based on provided fields
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  Object.entries(projectData).forEach(([key, value]) => {
    // Skip id, views, created_at, last_updated
    if (['id', 'views', 'created_at', 'last_updated'].includes(key)) {
      return;
    }
    
    // Handle special cases for JSON fields
    if (key === 'contact_info') {
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
    return getProjectById(id);
  }
  
  // Always update last_updated timestamp
  fields.push(`last_updated = NOW()`);
  
  values.push(id); // Add id as the last parameter
  
  const result = await query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex} AND deleted != true RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const project = result.rows[0];
  return {
    ...project,
    contact_info: project.contact_info || {}
  };
}

export async function incrementProjectViews(id: string): Promise<void> {
  await query('UPDATE projects SET views = views + 1 WHERE id = $1 AND deleted != true', [id]);
}

// DELETE (soft delete)
export async function deleteProject(id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    // Delete project bookmarks first
    await client.query('DELETE FROM project_bookmarks WHERE project_id = $1', [id]);
    
    // Soft delete the project
    const result = await client.query(
      'UPDATE projects SET deleted = true, last_updated = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  });
}

// Hard delete for admin purposes
export async function hardDeleteProject(id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    // Delete project bookmarks first
    await client.query('DELETE FROM project_bookmarks WHERE project_id = $1', [id]);
    
    // Hard delete the project
    const result = await client.query('DELETE FROM projects WHERE id = $1', [id]);
    
    return result.rowCount > 0;
  });
}

// Add more functions for filtering, searching, etc. 