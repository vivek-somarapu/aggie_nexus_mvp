import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelAuth } from '@/lib/accel-auth';
import { searchNetwork } from '@/lib/relays';

const SearchSchema = z.object({
  query: z.string().min(1).max(300),
  purpose: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelAuth(request, [
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 422 });
  }

  const results = await searchNetwork(profile.id, parsed.data.query, parsed.data.purpose);
  return NextResponse.json(results);
}
