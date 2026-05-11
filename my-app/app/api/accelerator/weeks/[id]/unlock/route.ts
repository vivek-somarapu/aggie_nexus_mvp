import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const UnlockSchema = z.object({
  is_unlocked: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UnlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const updates = parsed.data.is_unlocked
    ? { is_unlocked: true, unlocked_at: new Date().toISOString(), unlocked_by: profile.id }
    : { is_unlocked: false };

  const { data, error: dbError } = await supabase
    .from('accel_weeks')
    .update(updates)
    .eq('id', id)
    .select('id, week_number, is_unlocked, unlocked_at')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
