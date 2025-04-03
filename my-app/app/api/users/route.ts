import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with better error handling
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('API: GET /api/users - Request received');
  
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');
    const skill = searchParams.get('skill');
    const tamuParam = searchParams.get('tamu');
    
    // Log request parameters for debugging
    console.log('API: Fetching users with params:', {
      search: searchTerm,
      skill,
      tamu: tamuParam
    });
    
    // Create a simpler query structure to avoid potential issues
    let query = supabase.from('users').select('*');
    
    // Apply simple filters via Supabase
    // Filter by search term
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      if (searchTerm.length > 3) { // Only search bio for longer terms to avoid excessive matches
        query = query.or(`bio.ilike.%${searchTerm}%`);
      }
    }
    
    // Filter by skill
    if (skill) {
      query = query.contains('skills', [skill]);
    }
    
    // Filter by TAMU affiliation
    if (tamuParam === 'true' || tamuParam === 'false') {
      query = query.eq('is_texas_am_affiliate', tamuParam === 'true');
    }
    
    // Exclude deleted users
    query = query.eq('deleted', false);
    
    const { data: users, error } = await query;
    
    if (error) {
      console.error('API Error: Supabase query error:', error);
      return NextResponse.json({ error: 'Database query failed: ' + error.message }, { status: 500 });
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`API: Fetched ${users?.length || 0} users successfully in ${responseTime}ms`);
    
    return NextResponse.json(users || []);
  } catch (error: any) {
    console.error('API Critical Error: Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users: ' + (error.message || 'Unknown error') }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // Validate required fields
    if (!body.full_name || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: full_name and email are required' },
        { status: 400 }
      );
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        full_name: body.full_name,
        email: body.email,
        bio: body.bio || null,
        industry: body.industry || [],
        skills: body.skills || [],
        linkedin_url: body.linkedin_url || null,
        website_url: body.website_url || null,
        resume_url: body.resume_url || null,
        additional_links: body.additional_links || [],
        contact: body.contact || {},
        graduation_year: body.graduation_year || null,
        is_texas_am_affiliate: body.is_texas_am_affiliate || false,
        avatar: body.avatar || null,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('API Error: Error creating user:', error);
      
      // Check for duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: 'Failed to create user: ' + error.message }, { status: 500 });
    }
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('API Critical Error: Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user: ' + (error.message || 'Unknown error') }, 
      { status: 500 }
    );
  }
} 