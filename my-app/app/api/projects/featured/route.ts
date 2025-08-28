import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Project } from '@/lib/models/projects';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    
    // Select projects based on a combination of factors
    // 1. High view count
    // 2. Recently created
    // 3. Active recruitment status
    const sql = `
      SELECT * FROM projects
      WHERE 
        deleted != true AND
        project_status = 'active' AND
        recruitment_status IN ('open', 'hiring')
      ORDER BY 
        views DESC,
        created_at DESC
      LIMIT $1
    `;
    
    const result = await query(sql, [limit]);
    
    // Format the response
    const featuredProjects = result.rows.map((row: any) => ({
      ...row,
      contact_info: row.contact_info || {}
    })) as Project[];
    
    return NextResponse.json(featuredProjects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json({ error: 'Failed to fetch featured projects' }, { status: 500 });
  }
} 