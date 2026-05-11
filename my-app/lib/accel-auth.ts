// Server-side role authorization helpers for accelerator API routes.
// Import in route handlers to enforce role requirements without boilerplate.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AccelProfile, AccelRole } from '@/lib/accel-types';

type AuthSuccess = { profile: AccelProfile; error: null };
type AuthFailure = { profile: null; error: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

// Returns the caller's accel_profiles row if their role is in `allowedRoles`.
// Returns a 401/403 NextResponse otherwise.
// Usage: const { profile, error } = await requireAccelRole(request, ['aggiex_team']);
//        if (error) return error;
export async function requireAccelRole(
  allowedRoles: AccelRole[]
): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      profile: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return {
      profile: null,
      error: NextResponse.json(
        { error: 'No accelerator account found for this user' },
        { status: 403 }
      ),
    };
  }

  if (!allowedRoles.includes(profile.role as AccelRole)) {
    return {
      profile: null,
      error: NextResponse.json(
        { error: `Requires one of: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    };
  }

  return { profile: profile as AccelProfile, error: null };
}
