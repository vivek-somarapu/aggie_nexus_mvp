import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WeekUnlockList from './components/week-unlock-list';
import EmbedContentPanel from './components/embed-content-panel';

async function fetchSettingsData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'aggiex_team') redirect('/accelerator/dashboard');

  const { data: weeks } = await supabase
    .from('accel_weeks')
    .select('id, week_number, theme, start_date, end_date, is_unlocked, unlocked_at, intensity')
    .order('week_number');

  return { weeks: weeks ?? [] };
}

export default async function SettingsPage() {
  const { weeks } = await fetchSettingsData();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          AggieX Accelerator
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Settings</h1>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-medium text-neutral-200">Week Access</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Unlocked weeks are visible to founders, mentors, and MCE staff. Lock a week to hide its
          content and deliverables.
        </p>
        <WeekUnlockList weeks={weeks} />
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-sm font-medium text-neutral-200">AI Data</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Keep the AI Advisor&apos;s knowledge base current. Indexing is incremental — only
          content that has changed since the last run is re-processed.
        </p>
        <EmbedContentPanel />
      </section>
    </div>
  );
}
