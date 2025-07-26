import { createClient, clearAuthCookies } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side logout API route
 * Provides comprehensive session cleanup including server-side cookie removal
 */
export async function POST(request: NextRequest) {
  const logoutLog = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[LOGOUT API ${timestamp}] ${message}`, data);
    } else {
      console.log(`[LOGOUT API ${timestamp}] ${message}`);
    }
  };

  const logoutError = (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    if (error) {
      console.error(`[LOGOUT API ERROR ${timestamp}] ${message}`, error);
    } else {
      console.error(`[LOGOUT API ERROR ${timestamp}] ${message}`);
    }
  };

  logoutLog("Server-side logout initiated");

  try {
    // Create Supabase client for server-side operations
    const supabase = await createClient();
    
    // Get current user (if any) for logging
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      logoutLog("No valid session found during logout", { error: userError.message });
    } else if (user) {
      logoutLog("Logging out user", { userId: user.id, email: user.email });
    }

    // Perform Supabase logout
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      logoutError("Supabase sign out failed", signOutError);
      // Continue with cleanup even if Supabase signOut fails
    } else {
      logoutLog("Supabase sign out successful");
    }

    // Clear all auth-related cookies
    await clearAuthCookies();
    
    logoutLog("Server-side logout completed successfully");

    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });

  } catch (error) {
    logoutError("Server-side logout failed", error);
    
    // Even if logout fails, try to clear cookies
    try {
      await clearAuthCookies();
      logoutLog("Emergency cookie cleanup completed");
    } catch (cleanupError) {
      logoutError("Emergency cookie cleanup failed", cleanupError);
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle GET requests (for debugging or health checks)
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'Logout API endpoint - use POST method to logout' 
  });
} 