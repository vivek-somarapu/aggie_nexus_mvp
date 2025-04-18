import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function withAuth(
  req: NextRequest,
  handler: (userId: string, req: NextRequest) => Promise<NextResponse>
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated - use getUser for security
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // User is authenticated, pass their ID to the handler
    return handler(user.id, req);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 