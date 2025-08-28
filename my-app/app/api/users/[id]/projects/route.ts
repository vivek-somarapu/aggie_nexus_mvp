import { NextRequest, NextResponse } from 'next/server';
import { getProjectsByOwner } from '@/lib/models/projects';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projects = await getProjectsByOwner(id);
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json({ error: 'Failed to fetch user projects' }, { status: 500 });
  }
} 