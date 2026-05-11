import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { createClient } from '@/lib/supabase/server';
import { emailService, buildAccelInviteEmail } from '@/lib/email';

// ─── Schema ──────────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['founder', 'aggiex_team', 'mce_staff', 'mentor']),
  full_name: z.string().min(1).max(100),
  // Founder only
  team_id: z.string().uuid().optional(),
  // Mentor only — null means generalist (all teams)
  mentor_tier: z.enum(['operational', 'domain', 'capital']).optional(),
  mentor_team_ids: z.array(z.string().uuid()).nullable().optional(),
});

// ─── Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { profile: inviterProfile, error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { email, role, full_name, team_id, mentor_tier, mentor_team_ids } = parsed.data;

  if (role === 'founder' && !team_id) {
    return NextResponse.json(
      { error: 'team_id is required when inviting a founder' },
      { status: 422 }
    );
  }

  if (role === 'mentor' && !mentor_tier) {
    return NextResponse.json(
      { error: 'mentor_tier is required when inviting a mentor' },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  // Fetch team name for the invite email
  let teamName: string | undefined;
  if (team_id) {
    const { data: team } = await supabase
      .from('accel_teams')
      .select('name')
      .eq('id', team_id)
      .single();
    teamName = team?.name;
  }

  const admin = createAdminClient();
  const platformUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const onboardingUrl = `${platformUrl}/accelerator/onboarding`;

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        accel_role: role,
        full_name,
        accel_team_id: team_id ?? null,
        accel_invited_by: inviterProfile.id,
      },
      redirectTo: onboardingUrl,
    }
  );

  if (inviteError) {
    console.error('[ACCEL INVITE] Supabase invite error', inviteError);
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const newUserId = inviteData.user.id;

  // For mentors with specific team assignments: pre-create the assignment rows.
  // mentor_team_ids = null means generalist; empty or populated array = specific teams.
  if (role === 'mentor' && mentor_tier && mentor_team_ids && mentor_team_ids.length > 0) {
    const assignmentRows = mentor_team_ids.map((assignedTeamId) => ({
      mentor_id: newUserId,
      team_id: assignedTeamId,
      tier: mentor_tier,
      assigned_by: inviterProfile.id,
    }));

    const { error: assignmentError } = await supabase
      .from('accel_mentor_assignments')
      .insert(assignmentRows);

    if (assignmentError) {
      // Non-fatal — invite already sent, log the failure
      console.error('[ACCEL INVITE] Mentor assignment insert failed', assignmentError);
    }
  }

  // Send notification email
  try {
    await emailService.send(
      buildAccelInviteEmail({
        recipientName: full_name,
        recipientEmail: email,
        inviterName: inviterProfile.full_name,
        role,
        teamName,
        inviteUrl: onboardingUrl,
        platformUrl,
      })
    );
  } catch (emailError) {
    console.error('[ACCEL INVITE] Email notification failed', emailError);
  }

  return NextResponse.json(
    { message: 'Invite sent', user_id: newUserId },
    { status: 201 }
  );
}
