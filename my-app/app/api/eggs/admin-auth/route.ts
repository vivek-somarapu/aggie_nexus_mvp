/**
 * AggieX Easter Egg Hunt 2026
 * API route: POST /api/eggs/admin-auth
 * Validates the admin password against the EASTER_ADMIN_PASSWORD env var.
 * Returns 200 on match, 401 on mismatch.
 *
 * Egg tiers: Common (225) · Epic (20) · Legendary (4)
 * Token-gated: each QR code contains a unique single-use token
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Constants ───────────────────────────────────────────────────────────────

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_SERVER_ERROR = 500;

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const adminPassword = process.env.EASTER_ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('[admin-auth] EASTER_ADMIN_PASSWORD is not configured');
    return NextResponse.json(
      { error: 'server_configuration_error' },
      { status: HTTP_STATUS_SERVER_ERROR }
    );
  }

  const body = await request.json();
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json(
      { error: 'missing_password' },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: HTTP_STATUS_UNAUTHORIZED }
    );
  }

  return NextResponse.json({ success: true });
}
