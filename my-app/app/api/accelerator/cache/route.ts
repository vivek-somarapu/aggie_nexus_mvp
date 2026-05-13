import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRedis } from '@/lib/redis';

// ─── POST /api/accelerator/cache ──────────────────────────────────────────────
// Clears the Redis-cached AI Advisor context so the next request re-builds it
// from live Supabase data. Restricted to aggiex_team role.
//
// Deletes:
//   accel:ctx:admin   — shared admin/staff context
//
// Founder and mentor contexts expire on their own 5-minute TTL; they are
// personal and not worth bulk-clearing.

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'aggiex_team') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const redis = getRedis();

  if (!redis) {
    // No Redis configured — nothing to clear, context is always live.
    return NextResponse.json({ cleared: 0, note: 'Redis not configured; context is always live.' });
  }

  const keysToDelete = ['accel:ctx:admin'];
  await redis.del(...keysToDelete);

  return NextResponse.json({ cleared: keysToDelete.length });
}
