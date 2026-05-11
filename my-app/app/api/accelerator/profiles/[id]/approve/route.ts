import { NextRequest, NextResponse } from 'next/server';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  const { id } = await params;

  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from('accel_profiles')
    .select('id, role, is_active, onboarding_completed_at')
    .eq('id', id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.is_active) {
    return NextResponse.json({ error: 'User is already active' }, { status: 409 });
  }

  if (!profile.onboarding_completed_at) {
    return NextResponse.json(
      { error: 'User has not completed onboarding yet' },
      { status: 422 }
    );
  }

  const { error: updateError } = await supabase
    .from('accel_profiles')
    .update({ is_active: true })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'User approved' });
}
