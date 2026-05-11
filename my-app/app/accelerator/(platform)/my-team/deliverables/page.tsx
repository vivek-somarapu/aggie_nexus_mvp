import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SubmitDeliverablePanel from './components/submit-deliverable-panel';

async function fetchDeliverablesData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'founder' || !profile.team_id) {
    redirect('/accelerator/dashboard');
  }

  // All unlocked weeks with their deliverables and this team's submissions
  const { data: weeks } = await supabase
    .from('accel_weeks')
    .select('id, week_number, theme, start_date')
    .eq('is_unlocked', true)
    .order('week_number', { ascending: false });

  if (!weeks || weeks.length === 0) {
    return { weeks: [], profile };
  }

  const weekIds = weeks.map((w) => w.id);

  const { data: deliverables } = await supabase
    .from('accel_deliverables')
    .select('id, week_id, title, description, is_required, expected_format, sort_order')
    .in('week_id', weekIds)
    .order('sort_order');

  const deliverableIds = (deliverables ?? []).map((d) => d.id);

  const { data: submissions } = await supabase
    .from('accel_submissions')
    .select('id, deliverable_id, status, submitted_at, text_content, version')
    .eq('team_id', profile.team_id)
    .in('deliverable_id', deliverableIds)
    .order('version', { ascending: false });

  // Keep only the latest submission per deliverable
  const latestSubmissions = new Map<string, typeof submissions extends (infer T)[] | null ? T : never>();
  for (const submission of submissions ?? []) {
    if (!latestSubmissions.has(submission.deliverable_id)) {
      latestSubmissions.set(submission.deliverable_id, submission);
    }
  }

  const weeksWithDeliverables = weeks.map((week) => ({
    ...week,
    deliverables: (deliverables ?? [])
      .filter((d) => d.week_id === week.id)
      .map((d) => ({
        ...d,
        submission: latestSubmissions.get(d.id) ?? null,
      })),
  }));

  return { weeks: weeksWithDeliverables, profile };
}

export default async function DeliverablesPage() {
  const { weeks, profile } = await fetchDeliverablesData();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Deliverables</h1>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">
            No weeks unlocked yet. Check back once the program starts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeks.map((week) => {
            const submittedCount = week.deliverables.filter((d) =>
              d.submission?.status && ['submitted', 'under_review', 'approved'].includes(d.submission.status)
            ).length;

            return (
              <section key={week.id}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium text-neutral-200">
                    Week {week.week_number} — {week.theme}
                  </h2>
                  <span className="text-xs tabular-nums text-neutral-500">
                    {submittedCount}/{week.deliverables.length} submitted
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {week.deliverables.map((deliverable) => (
                    <SubmitDeliverablePanel
                      key={deliverable.id}
                      deliverable={deliverable}
                      teamId={profile.team_id!}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
