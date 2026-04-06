/**
 * AggieX Easter Egg Hunt 2026
 * API route: POST /api/claim-egg
 * Atomically validates a token and records the claim via the claim_egg() RPC.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Constants ───────────────────────────────────────────────────────────────

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_INTERNAL_ERROR = 500;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClaimRequestBody {
  token: string;
  name: string;
  email: string;
  self_reported_found_at?: string | null;
}

interface ClaimRpcResult {
  error?: 'invalid' | 'claimed';
  success?: boolean;
  egg_type?: string;
  egg_number?: number;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as Partial<ClaimRequestBody>;
  const { token, name, email, self_reported_found_at } = body;

  if (!token || !name || !email) {
    return NextResponse.json(
      { error: 'missing_fields' },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }

  // Use the service role key so the RPC can execute its FOR UPDATE lock
  // and UPDATE statement regardless of RLS policies.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[claim-egg] Missing Supabase environment variables');
    return NextResponse.json(
      { error: 'server_configuration_error' },
      { status: HTTP_STATUS_INTERNAL_ERROR }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.rpc('claim_egg', {
    p_token: token,
    p_name: name,
    p_email: email,
    p_found_at: self_reported_found_at ?? null,
  });

  if (error) {
    console.error('[claim-egg] RPC error:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: HTTP_STATUS_INTERNAL_ERROR }
    );
  }

  const result = data as ClaimRpcResult;

  if (result.error) {
    return NextResponse.json(result, { status: HTTP_STATUS_CONFLICT });
  }

  return NextResponse.json(result);
}
