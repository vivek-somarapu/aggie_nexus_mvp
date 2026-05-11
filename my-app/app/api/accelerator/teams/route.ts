import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const CreateTeamSchema = z.object({
  name: z.string().min(1).max(120),
  industry_vertical: z.string().optional(),
  venture_stage: z.string().optional(),
  entity_type: z.enum(['llc', 'c_corp', 's_corp', 'none', 'other']).default('none'),
  tamu_ip_flag: z.boolean().default(false),
  beachhead_market: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  pitch_deck_url: z.string().url().optional().or(z.literal('')),
});

export async function GET() {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_teams')
    .select(`
      *,
      accel_milestone_funding (funding_status, amount_unlocked, total_award),
      accel_founders (id)
    `)
    .order('name');

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

  const parsed = CreateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  // Get the active program id
  const { data: program } = await supabase
    .from('accel_programs')
    .select('id')
    .eq('is_active', true)
    .single();

  if (!program) {
    return NextResponse.json({ error: 'No active program found' }, { status: 400 });
  }

  const { data: team, error: dbError } = await supabase
    .from('accel_teams')
    .insert({ ...parsed.data, program_id: program.id })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Create the milestone funding record for this team
  await supabase.from('accel_milestone_funding').insert({
    team_id: team.id,
    program_id: program.id,
    updated_by: profile.id,
  });

  return NextResponse.json(team, { status: 201 });
}
