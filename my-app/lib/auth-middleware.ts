import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function withAuth(
  req: NextRequest,
  handler: (userId: string, req: NextRequest) => Promise<NextResponse>
) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);
    
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // User is authenticated, pass their ID to the handler
    return handler(session.user.id, req);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 