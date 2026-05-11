import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Standalone page — NOT wrapped in AcceleratorLayout.
// Shown after onboarding is complete while waiting for AggieX approval.

export default async function PendingApprovalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('full_name, is_active, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  // If they've been approved, send them on through
  if (profile.is_active && profile.onboarding_completed_at) {
    redirect('/accelerator/dashboard');
  }

  // If they haven't done onboarding yet, send them there
  if (!profile.onboarding_completed_at) {
    redirect('/accelerator/onboarding');
  }

  const firstName = profile.full_name.split(' ')[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900">
          <span className="text-2xl">⏳</span>
        </div>

        <p className="text-xs uppercase tracking-widest text-neutral-500">
          AggieX Summer 2026
        </p>
        <h1 className="mt-2 text-xl font-semibold text-neutral-100">
          You're on the list, {firstName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Your intake form has been submitted. An AggieX team member will review
          your application and activate your account — usually within one business
          day.
        </p>
        <p className="mt-6 text-xs text-neutral-600">
          Questions? Reach out to your AggieX contact directly.
        </p>
      </div>
    </div>
  );
}
