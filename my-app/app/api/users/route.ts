import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get search parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const skill = searchParams.get('skill');
    const tamuParam = searchParams.get('tamu');
    
    let query = supabase
      .from('users')
      .select('*')
      .order('full_name');
    
    // Filter for complete profiles only (users with bio and skills)
    query = query
      .not('bio', 'is', null)
      .not('bio', 'eq', '')
      .not('skills', 'is', null)
      .gt('skills', '{}'); // Ensure skills array is not empty
    
    // Apply search filter if provided
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }
    
    // Apply skill filter if provided
    if (skill) {
      query = query.contains('skills', [skill]);
    }
    
    // Apply TAMU filter if provided
    if (tamuParam === 'true') {
      query = query.eq('is_texas_am_affiliate', true);
    } else if (tamuParam === 'false') {
      query = query.eq('is_texas_am_affiliate', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: error.message 
      }, { status: 500 });
    }
    
    // Normalize data structure and ensure complete profiles
    const users = (data || []).filter((user: any) => {
      // Double-check that user has complete profile
      return user.bio && user.bio.trim() !== '' && 
             user.skills && Array.isArray(user.skills) && user.skills.length > 0;
    }).map((user: any) => ({
      ...user,
      additional_links: user.additional_links || [],
      contact: user.contact || {},
    }));
    
    console.log(`Filtered ${users.length} complete profiles from ${data?.length || 0} total users`);
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userData = await request.json();
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: error.message 
      }, { status: 500 });
    }
    
    // Normalize data structure
    const user = {
      ...data,
      additional_links: data.additional_links || [],
      contact: data.contact || {},
    };
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Users POST API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'  
    }, { status: 500 });
  }
} 