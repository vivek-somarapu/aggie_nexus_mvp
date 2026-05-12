import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const CreateFundingEventSchema = z.object({
  team_id: z.string().uuid(),
  program_id: z.string().uuid(),
  fund_type: z.enum(['dilutive', 'non_dilutive']),
  amount: z.number().nonnegative(),
  source: z.string().min(1).max(200),
  acquired_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().max(1000).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('team_id');

  const supabase = await createClient();

  let query = supabase
    .from('accel_funding_events')
    .select('*, accel_teams(name)')
    .order('acquired_at', { ascending: false });

  if (teamId) query = query.eq('team_id', teamId);

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateFundingEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_funding_events')
    .insert({ ...parsed.data, logged_by: profile.id })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
