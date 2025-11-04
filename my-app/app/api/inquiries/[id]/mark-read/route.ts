import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  console.log('Mark-read API called for inquiry ID:', id);
  
  if (!id) {
    return NextResponse.json({ error: 'Missing inquiry ID' }, { status: 400 });
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Current user:', user?.id, 'Error:', userError);

  // First, check the current state
  const { data: currentData, error: checkError } = await supabase
    .from('project_applications')
    .select('id, read_inquiry, user_id, project_id')
    .eq('id', id)
    .single();
  
  console.log('Current inquiry state:', currentData, 'Check error:', checkError);

  // Mark the inquiry as read in the database
  const { error, data } = await supabase
    .from('project_applications')
    .update({ read_inquiry: true })
    .eq('id', id)
    .select();

  console.log('Update result - Data:', data, 'Error:', error);

  if (error) {
    console.error('Error marking inquiry as read:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    console.error('No rows updated - possible RLS issue or ID not found');
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 });
  }

  console.log('Successfully marked inquiry as read:', data);
  return NextResponse.json({ success: true, data });
}
