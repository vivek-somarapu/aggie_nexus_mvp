import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelRole, AccelMetricType } from '@/lib/accel-types';

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

const ALLOWED_ROLES: AccelRole[] = ['aggiex_team', 'mce_staff'];

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchTractionData() {
  const supabase = await createClient();

  const [entriesResult, teamsResult] = await Promise.all([
    supabase
      .from('accel_traction_entries')
      .select(`
        id, team_id, metric_type, value, unit, entry_date, notes, source_evidence_url,
        accel_teams (name),
        accel_weeks (week_number)
      `)
      .order('entry_date', { ascending: false })
      .limit(200),

    supabase
      .from('accel_teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ]);

  return {
    entries: entriesResult.data ?? [],
    teams: teamsResult.data ?? [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface LatestMetric {
  metricType: AccelMetricType;
  value: number;
  unit: string;
  teamName: string;
  date: string;
}

function buildLatestPerMetricPerTeam(
  entries: Array<{ metric_type: string; value: number; unit: string; entry_date: string; accel_teams: { name: string } | null }>
): LatestMetric[] {
  // key = `${team_id}:${metric_type}`, keep the most recent entry
  const latestByKey = new Map<string, LatestMetric>();

  for (const entry of entries) {
    const teamName = (entry.accel_teams as { name: string } | null)?.name ?? 'Unknown';
    const key = `${teamName}:${entry.metric_type}`;
    const existing = latestByKey.get(key);
    if (!existing || entry.entry_date > existing.date) {
      latestByKey.set(key, {
        metricType: entry.metric_type as AccelMetricType,
        value: entry.value,
        unit: entry.unit,
        teamName,
        date: entry.entry_date,
      });
    }
  }

  return Array.from(latestByKey.values()).sort((a, b) =>
    a.metricType.localeCompare(b.metricType) || a.teamName.localeCompare(b.teamName)
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TractionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role as AccelRole)) {
    redirect('/accelerator/dashboard');
  }

  const { entries, teams } = await fetchTractionData();
  const latestMetrics = buildLatestPerMetricPerTeam(entries);

  // Group latest metrics by metric type for the summary grid
  const metricGroups = new Map<AccelMetricType, LatestMetric[]>();
  for (const metric of latestMetrics) {
    const existing = metricGroups.get(metric.metricType) ?? [];
    existing.push(metric);
    metricGroups.set(metric.metricType, existing);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Program</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Traction</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} logged across {teams.length} team{teams.length !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Latest values per metric per team */}
      {metricGroups.size > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Latest Values by Metric
          </h2>
          <div className="flex flex-col gap-4">
            {Array.from(metricGroups.entries()).map(([metricType, metrics]) => (
              <div key={metricType}>
                <p className={`mb-2 text-xs font-medium uppercase tracking-widest ${METRIC_COLORS[metricType]}`}>
                  {METRIC_TYPE_LABELS[metricType]}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {metrics.map((metric) => (
                    <div
                      key={`${metric.teamName}-${metric.metricType}`}
                      className="rounded-lg border border-neutral-800 px-3 py-3"
                    >
                      <p className="truncate text-xs text-neutral-500">{metric.teamName}</p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
                        {metric.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-neutral-600">{metric.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full entry log */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
          All Entries
        </h2>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-neutral-800 px-4 py-12 text-center text-sm text-neutral-500">
            No traction entries logged yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const entryDate = new Date(entry.entry_date + 'T00:00:00');
              const teamName = (entry.accel_teams as { name: string } | null)?.name;
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
                      {teamName && (
                        <span className="text-xs text-neutral-500">{teamName}</span>
                      )}
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
        )}
      </section>
    </div>
  );
}
