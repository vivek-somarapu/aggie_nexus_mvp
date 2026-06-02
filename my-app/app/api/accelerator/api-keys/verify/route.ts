import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requireAccelRole } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';

// Called by the developer panel immediately after key generation to confirm
// the key is reachable via the admin client (catches missing migration,
// missing SUPABASE_SERVICE_ROLE_KEY, and other infrastructure issues).
export async function POST(request: NextRequest) {
  const { error } = await requireAccelRole(['founder']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawKey = (body as { raw_key?: string }).raw_key;
  if (!rawKey || !rawKey.startsWith('ak_')) {
    return NextResponse.json({ error: 'raw_key required' }, { status: 400 });
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const admin = createAdminClient();

  const { data, error: dbError } = await admin
    .from('accel_api_keys')
    .select('id, label')
    .eq('key_hash', keyHash)
    .single();

  if (dbError) {
    console.error('[api-keys/verify] Lookup error:', dbError.message);
    return NextResponse.json(
      { valid: false, reason: dbError.message },
      { status: 200 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { valid: false, reason: 'Key not found in database' },
      { status: 200 }
    );
  }

  return NextResponse.json({ valid: true, label: data.label }, { status: 200 });
}
