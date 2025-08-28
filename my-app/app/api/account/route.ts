import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const supabase = createClient()
  
  try {
    // Delete the user account (using their own session credentials)
    const { error } = await supabase.auth.updateUser({
      data: { deleted: true }  // Mark as deleted in user metadata
    })
    
    if (error) {
      throw error
    }
    
    // Then sign them out
    await supabase.auth.signOut()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
} 