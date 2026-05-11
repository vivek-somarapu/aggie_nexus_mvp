import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelProfile, AccelRole } from '@/lib/accel-types';
import AcceleratorSidebar from './components/accelerator-sidebar';

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
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <AcceleratorSidebar role={profile.role as AccelRole} />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
