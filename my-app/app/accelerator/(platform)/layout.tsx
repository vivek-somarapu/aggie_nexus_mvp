import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelProfile, AccelRole } from '@/lib/accel-types';
import AccelShell from './components/accel-shell';

async function fetchAccelProfile(): Promise<AccelProfile | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('accel_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data ?? null;
}

export default async function AcceleratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await fetchAccelProfile();

  // No profile at all → not an accelerator user
  if (!profile) {
    redirect('/accelerator/access-denied');
  }

  // Onboarding not yet completed → send to intake form
  if (!profile.onboarding_completed_at) {
    redirect('/accelerator/onboarding');
  }

  // Onboarding done but awaiting AggieX approval → pending screen
  if (!profile.is_active) {
    redirect('/accelerator/pending-approval');
  }

  return (
    <AccelShell role={profile.role as AccelRole}>
      {children}
    </AccelShell>
  );
}
