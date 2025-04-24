import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This endpoint is for admin use only to set up the database triggers
// It should be protected or removed in production after initial setup
export async function POST(request: Request) {
  const supabase = createClient()
  
  // Check for admin auth (in a real app, you'd add proper admin validation)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Create a function to mark users as deleted
    await supabase.rpc('create_handle_user_deletion_function', {})
    
    // Create a trigger that will run on user metadata updates
    await supabase.rpc('create_user_deletion_trigger', {})
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting up triggers:', error)
    return NextResponse.json(
      { error: 'Failed to set up triggers' },
      { status: 500 }
    )
  }
} 