import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const DailyReportSchema = z.object({
  team_id: z.string().uuid(),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  win: z.string().min(1).max(2000),
  blocker: z.string().min(1).max(2000),
  metrics_snapshot: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole(['founder', 'aggiex_team']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = DailyReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { team_id, report_date, win, blocker, metrics_snapshot } = parsed.data;

  // Founders can only submit for their own team
  if (profile.role === 'founder' && profile.team_id !== team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();

  // One report per team per day — upsert on the unique(team_id, report_date) constraint
  const { data, error: dbError } = await supabase
    .from('accel_daily_reports')
    .upsert(
      {
        team_id,
        author_id: profile.id,
        report_date,
        win,
        blocker,
        metrics_snapshot: metrics_snapshot ?? null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: 'team_id,report_date', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
