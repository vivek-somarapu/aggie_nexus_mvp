import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { createClient } from '@/lib/supabase/server';
import { emailService, buildAccelInviteEmail } from '@/lib/email';

// ─── Schema ───────────────────────────────────────────────────────────────────

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

// ─── Handler ──────────────────────────────────────────────────────────────────

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
  const normalizedEmail = email.toLowerCase();

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

  const admin = createAdminClient();
  const supabase = await createClient();

  const requestOrigin = new URL(request.url).origin;
  const platformUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || requestOrigin;
  const loginUrl = `${platformUrl}/auth/login`;
  const onboardingUrl = `${platformUrl}/accelerator/onboarding`;

  // ── Step 1: Reject if already on the accelerator platform ────────────────────
  const { data: existingAccelProfile } = await admin
    .from('accel_profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingAccelProfile) {
    return NextResponse.json(
      { error: 'This person already has an AggieX profile on the platform.' },
      { status: 409 }
    );
  }

  // ── Fetch team name for the invite email ──────────────────────────────────────
  let teamName: string | undefined;
  if (team_id) {
    const { data: team } = await supabase
      .from('accel_teams')
      .select('name')
      .eq('id', team_id)
      .single();
    teamName = team?.name;
  }

  // ── Step 2: Check if email exists in the main users table ────────────────────
  // Users found here already have AggieX credentials and a full app profile.
  // They get immediate accelerator access — no invite link, no onboarding form.
  const { data: existingAppUser } = await admin
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingAppUser) {
    // ── Path A: existing AggieX user → grant immediate access ────────────────
    const { error: profileError } = await admin
      .from('accel_profiles')
      .insert({
        id: existingAppUser.id,
        role,
        full_name,
        email: normalizedEmail,
        team_id: team_id ?? null,
        invited_by: inviterProfile.id,
        is_active: true,
        onboarding_completed_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('[ACCEL INVITE] Profile insert failed for existing user', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Mentor assignments
    if (role === 'mentor' && mentor_tier && mentor_team_ids && mentor_team_ids.length > 0) {
      const assignmentRows = mentor_team_ids.map((assignedTeamId) => ({
        mentor_id: existingAppUser.id,
        team_id: assignedTeamId,
        tier: mentor_tier,
        assigned_by: inviterProfile.id,
      }));
      const { error: assignmentError } = await admin
        .from('accel_mentor_assignments')
        .insert(assignmentRows);
      if (assignmentError) {
        console.error('[ACCEL INVITE] Mentor assignment insert failed', assignmentError);
      }
    }

    try {
      await emailService.send(
        buildAccelInviteEmail({
          recipientName: full_name,
          recipientEmail: email,
          inviterName: inviterProfile.full_name,
          role,
          teamName,
          inviteUrl: loginUrl,
          platformUrl,
          isExistingUser: true,
        })
      );
    } catch (emailError) {
      console.error('[ACCEL INVITE] Email failed for existing user', emailError);
    }

    return NextResponse.json(
      { message: 'Access granted — existing AggieX user added to accelerator', user_id: existingAppUser.id },
      { status: 201 }
    );
  }

  // ── Step 3: No AggieX account — send a Supabase invite ───────────────────────
  // inviteUserByEmail creates the auth.users row immediately, which fires the
  // handle_accel_new_user trigger and creates the accel_profile. Supabase then
  // sends the invite email with a magic link to set their password.
  // After clicking the link, auth/callback detects the accel_profile and routes
  // the user to /accelerator/onboarding to complete their intake form.
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

  // Mentor assignments for new users (profile already created by trigger)
  if (role === 'mentor' && mentor_tier && mentor_team_ids && mentor_team_ids.length > 0) {
    const assignmentRows = mentor_team_ids.map((assignedTeamId) => ({
      mentor_id: newUserId,
      team_id: assignedTeamId,
      tier: mentor_tier,
      assigned_by: inviterProfile.id,
    }));
    const { error: assignmentError } = await admin
      .from('accel_mentor_assignments')
      .insert(assignmentRows);
    if (assignmentError) {
      console.error('[ACCEL INVITE] Mentor assignment insert failed', assignmentError);
    }
  }

  return NextResponse.json({ message: 'Invite sent', user_id: newUserId }, { status: 201 });
}
