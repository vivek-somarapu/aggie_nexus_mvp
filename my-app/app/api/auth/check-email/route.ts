import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if email exists in the users table
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .eq('deleted', false)
      .single();

    if (error) {
      // If error is "PGRST116" (no rows found), email doesn't exist
      if (error.code === 'PGRST116') {
        return NextResponse.json({ exists: false });
      }
      
      // For other errors, log and return false
      console.error('Error checking email existence:', error);
      return NextResponse.json({ exists: false });
    }

    // If we get here, email exists
    return NextResponse.json({ 
      exists: true,
      userId: data?.id 
    });

  } catch (error) {
    console.error('Unexpected error in check-email:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
