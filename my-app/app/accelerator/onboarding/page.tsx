import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelRole } from '@/lib/accel-types';
import OnboardingForm from './components/onboarding-form';

// Standalone page — intentionally NOT wrapped in AcceleratorLayout.
// Accessible to users who have accepted their invite but haven't yet
// completed onboarding or received AggieX approval.

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, full_name, onboarding_completed_at, is_active')
    .eq('id', user.id)
    .single();

  // No profile means they aren't part of the accelerator program
  if (!profile) redirect('/accelerator/access-denied');

  // Already onboarded + active → send to dashboard
  if (profile.onboarding_completed_at && profile.is_active) {
    redirect('/accelerator/dashboard');
  }

  // Onboarding done but awaiting approval → pending page
  if (profile.onboarding_completed_at && !profile.is_active) {
    redirect('/accelerator/pending-approval');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            AggieX Summer 2026
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-100">
            Welcome, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">
            {profile.role === 'founder'
              ? 'Tell us about your startup before we activate your account.'
              : 'Complete your profile to finish setting up your account.'}
          </p>
        </div>

        <OnboardingForm role={profile.role as AccelRole} fullName={profile.full_name} />
      </div>
    </div>
  );
}
