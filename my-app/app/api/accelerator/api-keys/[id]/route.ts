import { NextRequest, NextResponse } from 'next/server';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAccelRole(['founder']);
  if (error) return error;

  const { id } = await params;
  const supabase = await createClient();

  // RLS ensures founders can only delete their own keys
  const { error: dbError } = await supabase
    .from('accel_api_keys')
    .delete()
    .eq('id', id)
    .eq('profile_id', profile.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
