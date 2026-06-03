import { NextRequest, NextResponse } from 'next/server';
import { requireAccelAuth } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';

export async function GET(request: NextRequest) {
  const { profile, error } = await requireAccelAuth(request, ['founder', 'aggiex_team', 'mce_staff', 'mentor']);
  if (error) return error;

  const admin = createAdminClient();

  const [teamResult, weekResult] = await Promise.all([
    profile.team_id
      ? admin.from('accel_teams').select('id, name, venture_stage').eq('id', profile.team_id).single()
      : Promise.resolve({ data: null }),
    admin
      .from('accel_weeks')
      .select('week_number, theme')
      .eq('is_unlocked', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return NextResponse.json({
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    team: teamResult.data ?? null,
    current_week: weekResult.data ?? null,
  });
}
