import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, searchUsers, filterUsersBySkill } from '@/lib/models/users';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const skill = searchParams.get('skill');
    
    let users;
    
    if (searchTerm) {
      users = await searchUsers(searchTerm);
    } else if (skill) {
      users = await filterUsersBySkill(skill);
    } else {
      users = await getAllUsers();
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.full_name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name and email are required' },
        { status: 400 }
      );
    }
    
    const user = await createUser(body);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Check for duplicate email
    if (error.constraint === 'users_email_key') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
} 