import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const { profile, error } = await requireAccelRole(['founder']);
  if (error) return error;

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from('accel_api_keys')
    .select('id, label, last_used_at, created_at')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST() {
  const { profile, error } = await requireAccelRole(['founder']);
  if (error) return error;

  if (!profile.team_id) {
    return NextResponse.json({ error: 'No team assigned' }, { status: 400 });
  }

  const rawKey = `ak_${randomBytes(32).toString('base64url')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from('accel_api_keys')
    .insert({
      team_id: profile.team_id,
      profile_id: profile.id,
      key_hash: keyHash,
      label: `Key ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    })
    .select('id, label, created_at')
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ ...data, raw_key: rawKey }, { status: 201 });
}
