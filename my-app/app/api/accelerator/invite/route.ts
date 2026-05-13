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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true for roles that are active immediately upon profile creation.
 * Founders and mentors start inactive and require onboarding + approval.
 */
function isImmediatelyActive(role: string): boolean {
  return role === 'aggiex_team' || role === 'mce_staff';
}

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

  // Prefer an explicit env var; fall back to the request's own origin so the
  // email links are never built from an empty string.
  const requestOrigin = new URL(request.url).origin;
  const platformUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || requestOrigin;
  const onboardingUrl = `${platformUrl}/accelerator/onboarding`;
  const loginUrl = `${platformUrl}/auth/login`;

  // ── Step 1: Reject if an accel_profile already exists for this email ─────────
  // This is the definitive "already on the platform" check.
  const { data: existingProfile } = await admin
    .from('accel_profiles')
    .select('id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { error: 'This person already has an AggieX profile on the platform.' },
      { status: 409 }
    );
  }

  // ── Step 2: Check if the email exists in auth.users ───────────────────────────
  // inviteUserByEmail fails with "User already registered" when the email exists
  // in auth.users, even if there is no accel_profile yet. We detect this upfront
  // and create the profile directly instead of sending an invite link.
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingAuthUser = authUsers.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  // ── Fetch team name for the invite email (used in both paths) ─────────────────
  let teamName: string | undefined;
  if (team_id) {
    const { data: team } = await supabase
      .from('accel_teams')
      .select('name')
      .eq('id', team_id)
      .single();
    teamName = team?.name;
  }

  let newUserId: string;
  let isExistingAuthUser = false;

  if (existingAuthUser) {
    // ── Path A: Auth account exists, no accel_profile ─────────────────────────
    // The user already has credentials — no invite link needed. Create their
    // accel_profile directly so they can log in and be routed to onboarding.
    const { error: profileError } = await admin
      .from('accel_profiles')
      .insert({
        id: existingAuthUser.id,
        role,
        full_name,
        email: normalizedEmail,
        team_id: team_id ?? null,
        invited_by: inviterProfile.id,
        is_active: isImmediatelyActive(role),
      });

    if (profileError) {
      console.error('[ACCEL INVITE] Profile insert failed for existing auth user', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    newUserId = existingAuthUser.id;
    isExistingAuthUser = true;
  } else {
    // ── Path B: No auth account yet ───────────────────────────────────────────
    // Send a Supabase invite so the user can set a password. The trigger
    // handle_accel_new_user() creates the accel_profile on their first sign-in.
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

    newUserId = inviteData.user.id;
  }

  // ── Mentor team assignments (both paths) ─────────────────────────────────────
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
      // Non-fatal — profile already created, log and continue
      console.error('[ACCEL INVITE] Mentor assignment insert failed', assignmentError);
    }
  }

  // ── Send notification email ───────────────────────────────────────────────────
  try {
    await emailService.send(
      buildAccelInviteEmail({
        recipientName: full_name,
        recipientEmail: email,
        inviterName: inviterProfile.full_name,
        role,
        teamName,
        inviteUrl: isExistingAuthUser ? loginUrl : onboardingUrl,
        platformUrl,
        isExistingUser: isExistingAuthUser,
      })
    );
  } catch (emailError) {
    console.error('[ACCEL INVITE] Email notification failed', emailError);
  }

  const message = isExistingAuthUser
    ? 'Access granted — profile created for existing user'
    : 'Invite sent';

  return NextResponse.json({ message, user_id: newUserId }, { status: 201 });
}
