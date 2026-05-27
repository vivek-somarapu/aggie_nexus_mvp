import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { emailService } from '@/lib/email';

const AXR_ORIGIN = 'https://axr-1.onrender.com';

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 422 });
  }

  const { email } = parsed.data;
  const admin = createAdminClient();

  // Verify this email belongs to an accel_profile before issuing a link.
  const { data: profile } = await admin
    .from('accel_profiles')
    .select('id, full_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!profile) {
    // Return 200 regardless to avoid leaking which emails have access.
    return NextResponse.json({ success: true });
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${AXR_ORIGIN}/auth/callback` },
  });

  if (error) {
    console.error('[MAGIC LINK] generateLink failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const magicLink = data.properties.action_link;
  const otp = data.properties.email_otp;
  const name = profile.full_name ?? email.split('@')[0];

  await emailService.send({
    to: email,
    subject: 'Your AXR sign-in link',
    html: `
      <p>Hi ${name},</p>
      <p>Click to sign in to AXR:</p>
      <p>
        <a href="${magicLink}"
          style="display:inline-block;padding:10px 20px;background:#111;color:#fff;
                 border-radius:6px;text-decoration:none;font-weight:600;">
          Sign in to AXR
        </a>
      </p>
      <p>Or enter this code in the AXR app:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace;">
        ${otp}
      </p>
      <p style="color:#999;font-size:12px;">This link expires in 1 hour.</p>
    `.trim(),
  });

  return NextResponse.json({ success: true });
}
