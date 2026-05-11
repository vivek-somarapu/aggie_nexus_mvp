import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const UpsertSubmissionSchema = z.object({
  deliverable_id: z.string().uuid(),
  team_id: z.string().uuid(),
  status: z.enum([
    'not_started', 'in_progress', 'submitted',
    'under_review', 'approved', 'needs_revision', 'flagged',
  ]).optional(),
  text_content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole([
    'founder', 'aggiex_team', 'mce_staff',
  ]);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = UpsertSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { deliverable_id, team_id, status, text_content } = parsed.data;

  // Founders can only submit for their own team
  if (profile.role === 'founder' && profile.team_id !== team_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();

  // Check for an existing latest submission to version correctly
  const { data: existing } = await supabase
    .from('accel_submissions')
    .select('id, version, status')
    .eq('deliverable_id', deliverable_id)
    .eq('team_id', team_id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  let submission;

  if (!existing) {
    // First submission for this deliverable + team
    const { data, error: insertError } = await supabase
      .from('accel_submissions')
      .insert({
        deliverable_id,
        team_id,
        version: 1,
        status: status ?? 'in_progress',
        text_content: text_content ?? null,
        submitted_at: status === 'submitted' ? new Date().toISOString() : null,
        submitted_by: status === 'submitted' ? profile.id : null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    submission = data;
  } else {
    // Founders re-submitting create a new version
    const isFounderResubmit =
      profile.role === 'founder' &&
      ['approved', 'needs_revision', 'flagged'].includes(existing.status) &&
      status === 'submitted';

    if (isFounderResubmit) {
      const { data, error: insertError } = await supabase
        .from('accel_submissions')
        .insert({
          deliverable_id,
          team_id,
          version: existing.version + 1,
          status: 'submitted',
          text_content: text_content ?? null,
          submitted_at: new Date().toISOString(),
          submitted_by: profile.id,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      submission = data;
    } else {
      // Update the existing submission in place
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (status) updates.status = status;
      if (text_content !== undefined) updates.text_content = text_content;
      if (status === 'submitted') {
        updates.submitted_at = new Date().toISOString();
        updates.submitted_by = profile.id;
      }

      const { data, error: updateError } = await supabase
        .from('accel_submissions')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      submission = data;
    }
  }

  return NextResponse.json(submission, { status: 201 });
}
