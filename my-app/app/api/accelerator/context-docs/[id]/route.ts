import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 401);

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'aggiex_team') return errorResponse('Forbidden', 403);

  const { id } = await params;

  // Delete embedding row first to avoid orphaned vectors
  await supabase
    .from('accel_embeddings')
    .delete()
    .eq('source_table', 'accel_context_docs')
    .eq('source_id', id);

  const { error } = await supabase
    .from('accel_context_docs')
    .delete()
    .eq('id', id);

  if (error) return errorResponse(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
