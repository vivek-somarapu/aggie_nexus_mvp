import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Log environment variables (without sensitive values)
    console.log('Environment check:', {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
    
    // Check database connection
    let usersStatus = "unknown";
    let profilesStatus = "unknown";
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      usersStatus = error ? "error" : "ok";
      console.log('Users table check:', usersStatus, error ? error : 'No error');
    } catch (e) {
      usersStatus = "error";
      console.error('Error checking users table:', e);
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      profilesStatus = error ? "error" : "ok";
      console.log('Profiles table check:', profilesStatus, error ? error : 'No error');
    } catch (e) {
      profilesStatus = "error";
      console.error('Error checking profiles table:', e);
    }
    
    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        usersTable: usersStatus,
        profilesTable: profilesStatus
      }
    });
  } catch (error: any) {
    console.error('Debug route error:', error);
    return NextResponse.json({ 
      error: 'Debug check failed', 
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 