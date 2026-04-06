/**
 * AggieX Easter Egg Hunt 2026
 * Common egg landing page (server component).
 * Validates the token server-side, then hands the result to the client component.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

import { createClient } from '@/lib/supabase/server';
import EggCommon from '@/components/eggs/EggCommon';
import type { TokenStatus } from '@/components/eggs/ErrorState';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CommonEggPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  const tokenStatus = await resolveTokenStatus(token, 'common');

  return (
    <EggCommon
      token={token ?? null}
      tokenStatus={tokenStatus}
      eggNumber={null}
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveTokenStatus(
  token: string | undefined,
  eggType: string
): Promise<TokenStatus> {
  if (!token) return 'invalid';

  const supabase = await createClient();
  const { data } = await supabase
    .from('easter_egg_tokens')
    .select('is_claimed')
    .eq('token', token)
    .eq('egg_type', eggType)
    .single();

  if (!data) return 'invalid';
  return data.is_claimed ? 'claimed' : 'valid';
}
