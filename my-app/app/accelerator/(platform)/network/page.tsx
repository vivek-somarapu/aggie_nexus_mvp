import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelRole } from '@/lib/accel-types';
import NetworkSearch from './components/network-search';

export default async function NetworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const role = profile.role as AccelRole;

  if (role !== 'founder') redirect('/accelerator/dashboard');

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">People</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Network</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Search for mentors and investors. Introductions are facilitated by a relationship manager.
        </p>
      </div>

      <NetworkSearch />
    </div>
  );
}
