import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import type { AccelRole, AccelExpectedFormat } from '@/lib/accel-types';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import CreateDeliverablePanel from './components/create-deliverable-panel';
import DeliverableRow, { type DeliverableRowData } from './components/deliverable-row';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeekGroup {
  weekId: string;
  weekNumber: number;
  theme: string;
  isUnlocked: boolean;
  deliverables: DeliverableRowData[];
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

const fetchDeliverablesData = unstable_cache(
  async () => {
    const supabase = createAdminClient();

  const [weeksResult, deliverablesResult, teamsResult, submissionsResult] = await Promise.all([
    supabase
      .from('accel_weeks')
      .select('id, week_number, theme, is_unlocked')
      .eq('program_id', AGGIEX_2026_PROGRAM_ID)
      .order('week_number'),

    supabase
      .from('accel_deliverables')
      .select('id, week_id, title, description, is_required, expected_format, sort_order, assigned_team_ids')
      .order('week_id')
      .order('sort_order'),

    supabase
      .from('accel_teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('accel_submissions')
      .select('deliverable_id, team_id, status'),
  ]);

  const weeks = weeksResult.data ?? [];
  const deliverables = deliverablesResult.data ?? [];
  const teams = teamsResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const totalTeamCount = teams.length;

  // Build a map: deliverable_id → set of team_ids that have submitted
  const submittedTeamsPerDeliverable = new Map<string, Set<string>>();
  for (const submission of submissions) {
    if (['submitted', 'under_review', 'approved'].includes(submission.status)) {
      const existing = submittedTeamsPerDeliverable.get(submission.deliverable_id) ?? new Set();
      existing.add(submission.team_id);
      submittedTeamsPerDeliverable.set(submission.deliverable_id, existing);
    }
  }

  const weekGroups: WeekGroup[] = weeks.map((week) => {
    const weekDeliverables: DeliverableRowData[] = deliverables
      .filter((d) => d.week_id === week.id)
      .map((d) => {
        // Determine which teams this deliverable targets
        const targetTeamCount = d.assigned_team_ids === null
          ? totalTeamCount
          : d.assigned_team_ids.length;

        // Count unique teams that have submitted
        const submittedCount = submittedTeamsPerDeliverable.get(d.id)?.size ?? 0;

        return {
          id: d.id,
          week_id: d.week_id,
          title: d.title,
          description: d.description,
          is_required: d.is_required,
          expected_format: d.expected_format as AccelExpectedFormat,
          assigned_team_ids: d.assigned_team_ids,
          submittedCount,
          totalTeamCount: targetTeamCount,
        };
      });

    return {
      weekId: week.id,
      weekNumber: week.week_number,
      theme: week.theme,
      isUnlocked: week.is_unlocked,
      deliverables: weekDeliverables,
    };
  });

  return { weekGroups, teams, weeks };
  },
  ['accel-deliverables-data'],
  { revalidate: 30, tags: ['accel-deliverables'] }
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeliverablesPage() {
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
  if (role !== 'aggiex_team' && role !== 'mce_staff') {
    redirect('/accelerator/dashboard');
  }

  const { weekGroups, teams, weeks } = await fetchDeliverablesData();

  const totalDeliverables = weekGroups.reduce((sum, g) => sum + g.deliverables.length, 0);
  const canEdit = role === 'aggiex_team';

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Program</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Deliverables</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {totalDeliverables} deliverable{totalDeliverables !== 1 ? 's' : ''} across {weekGroups.length} week{weekGroups.length !== 1 ? 's' : ''}.
            {teams.length > 0 && ` ${teams.length} active teams.`}
          </p>
        </div>

        {canEdit && (
          <CreateDeliverablePanel weeks={weeks} teams={teams} />
        )}
      </div>

      {/* Week groups */}
      <div className="flex flex-col gap-8">
        {weekGroups.map((group) => (
          <section key={group.weekId}>
            {/* Week header */}
            <div className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <h2 className="text-sm font-semibold text-neutral-200">
                Week {group.weekNumber}
              </h2>
              <span className="text-sm font-normal text-neutral-500">
                — {group.theme}
              </span>
              <span
                className={[
                  'ml-1 rounded-full px-2 py-0.5 text-xs',
                  group.isUnlocked
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-500',
                ].join(' ')}
              >
                {group.isUnlocked ? 'Unlocked' : 'Locked'}
              </span>
              <span className="ml-auto text-xs text-neutral-600">
                {group.deliverables.length} deliverable{group.deliverables.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Deliverable rows */}
            {group.deliverables.length === 0 ? (
              <p className="text-xs text-neutral-600">
                No deliverables for this week.
                {canEdit && ' Create one with the button above.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {group.deliverables.map((deliverable) => (
                  <DeliverableRow
                    key={deliverable.id}
                    deliverable={deliverable}
                    teams={teams}
                    weeks={weeks}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
