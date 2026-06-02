// Server-side role authorization helpers for accelerator API routes.
// Import in route handlers to enforce role requirements without boilerplate.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { createHash } from 'crypto';
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

// Accepts either a Supabase session cookie OR an API key bearer token.
// Used by routes exposed to the MCP server (submissions, traction).
// API keys are only issued to founders; `allowedRoles` should include 'founder'.
export async function requireAccelAuth(
  request: NextRequest,
  allowedRoles: AccelRole[]
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ak_')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (bearerToken) {
    const keyHash = createHash('sha256').update(bearerToken).digest('hex');
    const admin = createAdminClient();
    const { data: keyRow, error: keyLookupError } = await admin
      .from('accel_api_keys')
      .select('profile_id, team_id')
      .eq('key_hash', keyHash)
      .single();

    if (keyLookupError) {
      console.error('[requireAccelAuth] API key lookup failed:', keyLookupError.message);
    }

    if (!keyRow) {
      return {
        profile: null,
        error: NextResponse.json({ error: 'Invalid API key' }, { status: 401 }),
      };
    }

    // Update last_used_at asynchronously (fire-and-forget)
    admin
      .from('accel_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)
      .then(() => {});

    const { data: profile } = await admin
      .from('accel_profiles')
      .select('*')
      .eq('id', keyRow.profile_id)
      .single();

    if (!profile) {
      return {
        profile: null,
        error: NextResponse.json({ error: 'Profile not found' }, { status: 403 }),
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

  // Fall back to session-based auth
  return requireAccelRole(allowedRoles);
}
