import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogTractionForm from './components/log-traction-form';
import type { AccelMetricType } from '@/lib/accel-types';

const METRIC_TYPE_LABELS: Record<AccelMetricType, string> = {
  revenue: 'Revenue',
  users: 'Active Users',
  lois: 'Letters of Intent',
  pilots: 'Pilots',
  retention: 'Retention Rate',
  churn: 'Churn Rate',
  other: 'Other',
};

const METRIC_COLORS: Record<AccelMetricType, string> = {
  revenue: 'text-emerald-400',
  users: 'text-blue-400',
  lois: 'text-purple-400',
  pilots: 'text-amber-400',
  retention: 'text-teal-400',
  churn: 'text-red-400',
  other: 'text-neutral-400',
};

async function fetchTractionPageData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile?.team_id) redirect('/accelerator/dashboard');
  if (profile.role !== 'founder') redirect('/accelerator/dashboard');

  const [tractionResult, weeksResult] = await Promise.all([
    supabase
      .from('accel_traction_entries')
      .select('id, metric_type, value, unit, entry_date, notes, source_evidence_url, accel_weeks(week_number)')
      .eq('team_id', profile.team_id)
      .order('entry_date', { ascending: false })
      .limit(30),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme')
      .eq('is_unlocked', true)
      .order('week_number'),
  ]);

  return {
    teamId: profile.team_id,
    tractionEntries: tractionResult.data ?? [],
    unlockedWeeks: weeksResult.data ?? [],
    today: new Date().toISOString().split('T')[0],
  };
}

export default async function MyTeamTractionPage() {
  const { teamId, tractionEntries, unlockedWeeks, today } = await fetchTractionPageData();

  // Group entries by metric type for a summary view
  const metricSummary = buildMetricSummary(tractionEntries);

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Traction</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Log metrics that show your startup is gaining traction.
        </p>
      </div>

      {/* Latest per-metric summary */}
      {metricSummary.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {metricSummary.map(({ metricType, latestValue, unit }) => (
            <div key={metricType} className="rounded-lg border border-neutral-800 px-3 py-3">
              <p className={`text-xs font-medium uppercase tracking-widest ${METRIC_COLORS[metricType as AccelMetricType]}`}>
                {METRIC_TYPE_LABELS[metricType as AccelMetricType]}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
                {latestValue.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-600">{unit}</p>
            </div>
          ))}
        </div>
      )}

      <LogTractionForm
        teamId={teamId}
        unlockedWeeks={unlockedWeeks}
        today={today}
      />

      {/* History */}
      {tractionEntries.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Entry History
          </h2>
          <div className="flex flex-col gap-2">
            {tractionEntries.map((entry) => {
              const entryDate = new Date(entry.entry_date + 'T00:00:00');
              const weekNumber = (entry.accel_weeks as { week_number: number } | null)?.week_number;
              const metricType = entry.metric_type as AccelMetricType;

              return (
                <div
                  key={entry.id}
                  className="flex items-start justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium uppercase tracking-widest ${METRIC_COLORS[metricType]}`}>
                        {METRIC_TYPE_LABELS[metricType]}
                      </span>
                      {weekNumber && (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                          Wk {weekNumber}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="mt-1 text-xs text-neutral-500 line-clamp-1">{entry.notes}</p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-neutral-100">
                      {entry.value.toLocaleString()} {entry.unit}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

interface MetricSummaryRow {
  metricType: string;
  latestValue: number;
  unit: string;
}

function buildMetricSummary(entries: Array<{ metric_type: string; value: number; unit: string; entry_date: string }>): MetricSummaryRow[] {
  const latest = new Map<string, { value: number; unit: string; date: string }>();

  for (const entry of entries) {
    const existing = latest.get(entry.metric_type);
    if (!existing || entry.entry_date > existing.date) {
      latest.set(entry.metric_type, { value: entry.value, unit: entry.unit, date: entry.entry_date });
    }
  }

  return Array.from(latest.entries()).map(([metricType, data]) => ({
    metricType,
    latestValue: data.value,
    unit: data.unit,
  }));
}
