import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const CreateTractionSchema = z.object({
  team_id: z.string().uuid(),
  week_id: z.string().uuid().optional(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  metric_type: z.enum([
    'revenue', 'users', 'lois', 'pilots', 'retention', 'churn', 'other',
  ]),
  value: z.number(),
  unit: z.string().min(1).max(60),
  notes: z.string().optional(),
  source_evidence_url: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAccelRole([
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('team_id');
  const metricType = searchParams.get('metric_type');

  const supabase = await createClient();

  let query = supabase
    .from('accel_traction_entries')
    .select('*, accel_weeks(week_number)')
    .order('entry_date', { ascending: false })
    .limit(100);

  if (teamId) query = query.eq('team_id', teamId);
  if (metricType) query = query.eq('metric_type', metricType);

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole([
    'founder', 'aggiex_team',
  ]);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateTractionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  if (profile.role === 'founder' && profile.team_id !== parsed.data.team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_traction_entries')
    .insert({ ...parsed.data, logged_by: profile.id })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
