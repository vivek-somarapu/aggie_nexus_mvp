import { NextRequest, NextResponse } from 'next/server';
import { requireAccelAuth } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { provisionMember } from '@/lib/relays';
import type { AccelRole } from '@/lib/accel-types';

// Idempotent — safe to call on every session start.
// Provisions the authenticated user into Relays with their current profile data.
export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelAuth(request, [
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  const admin = createAdminClient();
  const { data: mentorProfile } = await admin
    .from('accel_mentor_profiles')
    .select('bio, title, company')
    .eq('id', profile.id)
    .maybeSingle();

  await provisionMember({
    external_user_id: profile.id,
    role: profile.role as AccelRole,
    full_name: profile.full_name ?? '',
    email: profile.email ?? '',
    title: mentorProfile?.title ?? null,
    company: mentorProfile?.company ?? null,
    bio: mentorProfile?.bio ?? null,
  });

  return NextResponse.json({ ok: true });
}
