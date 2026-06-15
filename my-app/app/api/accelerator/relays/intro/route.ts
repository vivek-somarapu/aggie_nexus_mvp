import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelAuth } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';

const IntroSchema = z.object({
  result_id: z.string().min(1),
  message: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelAuth(request, ['founder']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = IntroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from('accel_intro_requests')
    .upsert(
      {
        requester_id: profile.id,
        result_id: parsed.data.result_id,
        message: parsed.data.message ?? null,
        status: 'pending',
        requested_at: new Date().toISOString(),
      },
      { onConflict: 'requester_id,result_id', ignoreDuplicates: true },
    );

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const { profile, error } = await requireAccelAuth(request, ['founder']);
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from('accel_intro_requests')
    .select('result_id, status, requested_at')
    .eq('requester_id', profile.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
