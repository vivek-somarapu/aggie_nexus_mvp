import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DeveloperPanel from './components/developer-panel';

export default async function DeveloperPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'founder') redirect('/accelerator/dashboard');

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Developer API</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Connect Claude Code, Cursor, or any coding agent to AggieX — automate deliverable
          submissions and traction logging while you build.
        </p>
      </div>
      <DeveloperPanel />
    </div>
  );
}
