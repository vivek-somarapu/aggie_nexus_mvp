import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';

const FundingSchema = z.object({
  funding_status: z.enum(['on_track', 'paused', 'probation', 'exited']).optional(),
  amount_unlocked: z.number().min(0).optional(),
  total_award: z.number().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ team_id: string }> }
) {
  const { error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  const { team_id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = FundingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  // Upsert the funding row — one row per team
  const { data, error: dbError } = await supabase
    .from('accel_milestone_funding')
    .upsert(
      { team_id, program_id: AGGIEX_2026_PROGRAM_ID, ...parsed.data },
      { onConflict: 'team_id' }
    )
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
