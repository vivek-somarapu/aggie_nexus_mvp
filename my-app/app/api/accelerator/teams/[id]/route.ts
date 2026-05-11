import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  industry_vertical: z.string().optional(),
  venture_stage: z.string().optional(),
  entity_type: z.enum(['llc', 'c_corp', 's_corp', 'none', 'other']).optional(),
  tamu_ip_flag: z.boolean().optional(),
  beachhead_market: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  pitch_deck_url: z.string().url().optional().or(z.literal('')),
  logo_url: z.string().url().optional().or(z.literal('')),
  crucible_outcome: z.enum(['accelerate', 'refine', 'restructure']).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff', 'mentor', 'founder']);
  if (error) return error;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_teams')
    .select(`
      *,
      accel_founders (*),
      accel_milestone_funding (*),
      accel_mentor_assignments (
        *,
        accel_profiles!accel_mentor_assignments_mentor_id_fkey (full_name, email)
      )
    `)
    .eq('id', id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpdateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };

  if (parsed.data.crucible_outcome) {
    updates.crucible_reviewed_at = new Date().toISOString();
  }

  const { data, error: dbError } = await supabase
    .from('accel_teams')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
