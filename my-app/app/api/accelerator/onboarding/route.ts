import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Shared fields for all roles
const BaseOnboardingSchema = z.object({
  full_name: z.string().min(1).max(100),
  role: z.enum(['founder', 'aggiex_team', 'mce_staff', 'mentor']),
});

// Founder-only fields for startup + initial traction snapshot
const FounderOnboardingSchema = BaseOnboardingSchema.extend({
  role: z.literal('founder'),
  startup_description: z.string().max(1000).optional(),
  entity_type: z.enum(['llc', 'c_corp', 's_corp', 'none', 'other']).optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  // Initial traction numbers (optional — zero is valid, undefined = skip)
  initial_revenue_usd: z.number().min(0).optional(),
  initial_users: z.number().min(0).int().optional(),
  initial_lois: z.number().min(0).int().optional(),
  initial_pilots: z.number().min(0).int().optional(),
  traction_notes: z.string().max(500).optional(),
});

const OnboardingSchema = z.discriminatedUnion('role', [
  FounderOnboardingSchema,
  BaseOnboardingSchema.extend({ role: z.literal('aggiex_team') }),
  BaseOnboardingSchema.extend({ role: z.literal('mce_staff') }),
  BaseOnboardingSchema.extend({ role: z.literal('mentor') }),
]);

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile — must exist (created by DB trigger on invite accept)
  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('id, role, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'No accelerator profile found' }, { status: 404 });
  }

  if (profile.onboarding_completed_at) {
    return NextResponse.json({ error: 'Onboarding already completed' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Internal roles (aggiex_team, mce_staff) are activated immediately.
  // Founders and mentors stay inactive until an AggieX member approves them.
  const isInternalRole = data.role === 'aggiex_team' || data.role === 'mce_staff';

  const profileUpdates: Record<string, unknown> = {
    full_name: data.full_name,
    onboarding_completed_at: new Date().toISOString(),
    ...(isInternalRole ? { is_active: true } : {}),
  };

  const { error: profileError } = await supabase
    .from('accel_profiles')
    .update(profileUpdates)
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // For founders: insert initial traction entries if provided
  if (data.role === 'founder') {
    const { data: profileWithTeam } = await supabase
      .from('accel_profiles')
      .select('team_id')
      .eq('id', user.id)
      .single();

    const teamId = profileWithTeam?.team_id;

    if (teamId) {
      const today = new Date().toISOString().slice(0, 10);
      const tractionEntries: Array<{
        team_id: string;
        metric_type: string;
        value: number;
        unit: string;
        entry_date: string;
        notes: string;
        logged_by: string;
      }> = [];

      const addEntry = (metric_type: string, value: number | undefined, unit: string) => {
        if (value !== undefined && value >= 0) {
          tractionEntries.push({
            team_id: teamId,
            metric_type,
            value,
            unit,
            entry_date: today,
            notes: 'Initial traction — submitted at onboarding',
            logged_by: user.id,
          });
        }
      };

      addEntry('revenue', data.initial_revenue_usd, 'USD');
      addEntry('users', data.initial_users, 'users');
      addEntry('lois', data.initial_lois, 'LOIs');
      addEntry('pilots', data.initial_pilots, 'pilots');

      if (tractionEntries.length > 0) {
        const { error: tractionError } = await supabase
          .from('accel_traction_entries')
          .insert(tractionEntries);

        if (tractionError) {
          console.error('[ONBOARDING] Traction insert failed', tractionError);
        }
      }
    }
  }

  return NextResponse.json(
    { message: isInternalRole ? 'active' : 'pending_approval' },
    { status: 200 }
  );
}
