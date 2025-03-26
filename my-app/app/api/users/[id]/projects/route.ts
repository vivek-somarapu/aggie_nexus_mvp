import { NextRequest, NextResponse } from 'next/server';
import { getProjectsByOwner } from '@/lib/models/projects';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    const projects = await getProjectsByOwner(userId);
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch user projects' }, { status: 500 });
  }
} 