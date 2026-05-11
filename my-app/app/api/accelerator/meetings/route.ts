import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const CreateMeetingSchema = z.object({
  team_id: z.string().uuid(),
  week_id: z.string().uuid().optional(),
  meeting_type: z.enum([
    'mentor_session', 'demo_day', 'one_on_one',
    'crucible', 'speaker_session', 'other',
  ]),
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  attendees: z.array(z.string()).optional(),
  notes: z.string().optional(),
  action_items: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAccelRole([
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('team_id');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

  const supabase = await createClient();

  let query = supabase
    .from('accel_meeting_records')
    .select(`
      id, team_id, week_id, meeting_type, meeting_date,
      duration_minutes, attendees, notes, action_items,
      logged_by, created_at,
      accel_weeks (week_number)
    `)
    .order('meeting_date', { ascending: false })
    .limit(limit);

  if (teamId) {
    query = query.eq('team_id', teamId);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole([
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { team_id } = parsed.data;

  // Founders can only log meetings for their own team
  if (profile.role === 'founder' && profile.team_id !== team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_meeting_records')
    .insert({ ...parsed.data, logged_by: profile.id })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
