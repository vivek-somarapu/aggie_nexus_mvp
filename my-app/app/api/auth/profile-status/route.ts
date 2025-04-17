import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/models/users'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = await createClient(cookieStore)
  
  // Get current authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }
  
  try {
    const userId = session.user.id
    const profile = await getUserById(userId)
    
    const isProfileComplete = !!(
      profile && 
      profile.bio && 
      profile.skills && 
      profile.skills.length > 0
    )
    
    return NextResponse.json({
      isAuthenticated: true,
      isProfileComplete,
      shouldSetupProfile: !isProfileComplete,
      userId
    })
  } catch (error) {
    console.error('Error checking profile status:', error)
    return NextResponse.json(
      { error: 'Error checking profile status' },
      { status: 500 }
    )
  }
} 