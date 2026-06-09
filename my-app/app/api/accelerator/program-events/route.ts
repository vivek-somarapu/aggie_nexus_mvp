import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';

const CreateProgramEventSchema = z.object({
  event_type: z.enum([
    'week_start', 'week_end', 'demo_day', 'crucible', 'speaker_day',
    'mentor_day', 'off_day', 'one_on_one', 'social_event', 'final_demo_day', 'program_close',
  ]),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  is_mandatory: z.boolean().default(false),
  visible_to: z.enum(['all', 'founders', 'mentors', 'aggiex_team']).default('all'),
  week_number: z.number().int().min(1).max(10).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateProgramEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_program_events')
    .insert({
      ...parsed.data,
      program_id: AGGIEX_2026_PROGRAM_ID,
      created_by: profile.id,
    })
    .select()
    .single();

  if (dbError) {
    if (dbError.code === '23505') {
      return NextResponse.json(
        { error: 'An event of this type already exists on that date.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
