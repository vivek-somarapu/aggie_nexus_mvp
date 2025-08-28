import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Project } from '@/lib/models/projects';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get all the possible search parameters
    const searchTerm = searchParams.get('q') || '';
    const skills = searchParams.getAll('skill');
    const industries = searchParams.getAll('industry');
    const isIdea = searchParams.get('isIdea');
    const status = searchParams.get('status');
    const locationType = searchParams.get('locationType');
    const ownerId = searchParams.get('ownerId');
    
    // Base query
    let sql = `
      SELECT * FROM projects
      WHERE deleted != true
    `;
    
    // Array to hold our parameters
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add search term condition if provided
    if (searchTerm) {
      sql += ` AND (
        title ILIKE $${paramIndex} 
        OR description ILIKE $${paramIndex}
      )`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    // Add skills filter if provided
    if (skills.length > 0) {
      const skillPlaceholders = skills.map((_, i) => `$${paramIndex + i}`).join(', ');
      sql += ` AND required_skills && ARRAY[${skillPlaceholders}]::text[]`;
      params.push(...skills);
      paramIndex += skills.length;
    }
    
    // Add industry filter if provided
    if (industries.length > 0) {
      const industryPlaceholders = industries.map((_, i) => `$${paramIndex + i}`).join(', ');
      sql += ` AND industry && ARRAY[${industryPlaceholders}]::text[]`;
      params.push(...industries);
      paramIndex += industries.length;
    }
    
    // Add idea filter if provided
    if (isIdea === 'true' || isIdea === 'false') {
      sql += ` AND is_idea = $${paramIndex}`;
      params.push(isIdea === 'true');
      paramIndex++;
    }
    
    // Add status filter if provided
    if (status) {
      sql += ` AND project_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // Add location type filter if provided
    if (locationType) {
      sql += ` AND location_type = $${paramIndex}`;
      params.push(locationType);
      paramIndex++;
    }
    
    // Add owner filter if provided
    if (ownerId) {
      sql += ` AND owner_id = $${paramIndex}`;
      params.push(ownerId);
      paramIndex++;
    }
    
    // Add ordering
    sql += ` ORDER BY created_at DESC, views DESC`;
    
    // Execute the query
    const result = await query(sql, params);
    
    // Format the response
    const projects = result.rows.map((row: any) => ({
      ...row,
      contact_info: row.contact_info || {}
    })) as Project[];
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error searching projects:', error);
    return NextResponse.json({ error: 'Failed to search projects' }, { status: 500 });
  }
} 