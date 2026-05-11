'use server';

import { createClient } from '@/lib/supabase/server';

type AccessResult =
  | { hasAccess: true }
  | { hasAccess: false; reason: 'not_found' | 'not_active' | 'unauthenticated' };

// Called from the Caneckt landing page after a successful Supabase sign-in.
// Returns whether the signed-in user has an active accel_profiles row.
export async function checkAccelAccess(): Promise<AccessResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { hasAccess: false, reason: 'unauthenticated' };

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile) return { hasAccess: false, reason: 'not_found' };
  if (!profile.is_active) return { hasAccess: false, reason: 'not_active' };

  return { hasAccess: true };
}
