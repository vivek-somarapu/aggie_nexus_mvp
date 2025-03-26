import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { User } from '@/lib/models/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get all the possible search parameters
    const searchTerm = searchParams.get('q') || '';
    const skills = searchParams.getAll('skill');
    const industries = searchParams.getAll('industry');
    const isTexasAM = searchParams.get('isTexasAM');
    const graduationYear = searchParams.get('graduationYear');
    
    // Base query
    let sql = `
      SELECT * FROM users
      WHERE deleted != true
    `;
    
    // Array to hold our parameters
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add search term condition if provided
    if (searchTerm) {
      sql += ` AND (
        full_name ILIKE $${paramIndex} 
        OR email ILIKE $${paramIndex} 
        OR bio ILIKE $${paramIndex}
      )`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    // Add skills filter if provided
    if (skills.length > 0) {
      const skillPlaceholders = skills.map((_, i) => `$${paramIndex + i}`).join(', ');
      sql += ` AND skills && ARRAY[${skillPlaceholders}]::text[]`;
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
    
    // Add Texas A&M filter if provided
    if (isTexasAM === 'true' || isTexasAM === 'false') {
      sql += ` AND is_texas_am_affiliate = $${paramIndex}`;
      params.push(isTexasAM === 'true');
      paramIndex++;
    }
    
    // Add graduation year filter if provided
    if (graduationYear) {
      sql += ` AND graduation_year = $${paramIndex}`;
      params.push(parseInt(graduationYear, 10));
      paramIndex++;
    }
    
    // Add ordering
    sql += ` ORDER BY full_name ASC, views DESC`;
    
    // Add this before executing the query to debug:
    console.log("SQL Query:", sql);
    console.log("Parameters:", params);
    
    // Execute the query
    const result = await query(sql, params);
    
    // Format the response
    const users = result.rows.map((row: any) => ({
      ...row,
      additional_links: row.additional_links || [],
      contact: row.contact || {}
    })) as User[];
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    // Return more detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to search users', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 