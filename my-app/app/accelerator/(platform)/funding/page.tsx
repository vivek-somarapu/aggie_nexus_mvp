import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import type { AccelRole, AccelFundType, AccelFundingStatus } from '@/lib/accel-types';
import {
  AGGIEX_2026_PROGRAM_ID,
  FUND_TYPE_LABELS,
  FUNDING_STATUS_LABELS,
} from '@/lib/accel-types';
import LogFundingEventPanel from './components/log-funding-event-panel';
import OnTrackAssessmentPanel from './components/on-track-assessment-panel';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_ROLES: AccelRole[] = ['aggiex_team', 'mce_staff'];

const FUND_TYPE_COLORS: Record<AccelFundType, string> = {
  dilutive: 'text-purple-400 bg-purple-400/10',
  non_dilutive: 'text-emerald-400 bg-emerald-400/10',
};

const FUNDING_STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400',
  paused: 'text-amber-400',
  probation: 'text-red-400',
  exited: 'text-neutral-500',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface FundingEvent {
  id: string;
  team_id: string;
  fund_type: AccelFundType;
  amount: number;
  source: string;
  acquired_at: string;
  notes: string | null;
}

interface TeamFundingData {
  teamId: string;
  teamName: string;
  milestoneFunding: {
    funding_status: AccelFundingStatus;
    amount_unlocked: number;
    total_award: number;
  } | null;
  fundingEvents: FundingEvent[];
  dilutiveTotal: number;
  nonDilutiveTotal: number;
  submittedDeliverableCount: number;
  totalDeliverableCount: number;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchFundingPageData() {
  const supabase = await createClient();

  const [teamsResult, milestonesResult, eventsResult, deliverableCountResult, submissionsResult] =
    await Promise.all([
      supabase
        .from('accel_teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),

      supabase
        .from('accel_milestone_funding')
        .select('team_id, funding_status, amount_unlocked, total_award')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID),

      supabase
        .from('accel_funding_events')
        .select('id, team_id, fund_type, amount, source, acquired_at, notes')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .order('acquired_at', { ascending: false }),

      supabase
        .from('accel_deliverables')
        .select('id, week_id, assigned_team_ids'),

      supabase
        .from('accel_submissions')
        .select('deliverable_id, team_id, status')
        .in('status', ['submitted', 'under_review', 'approved']),
    ]);

  const teams = teamsResult.data ?? [];
  const milestones = milestonesResult.data ?? [];
  const events = eventsResult.data ?? [];
  const deliverables = deliverableCountResult.data ?? [];
  const submissions = submissionsResult.data ?? [];

  // Build fast lookup maps
  const milestoneByTeam = new Map(milestones.map((m) => [m.team_id, m]));

  const eventsByTeam = new Map<string, FundingEvent[]>();
  for (const event of events) {
    const existing = eventsByTeam.get(event.team_id) ?? [];
    existing.push(event as FundingEvent);
    eventsByTeam.set(event.team_id, existing);
  }

  // Count submitted deliverables per team
  const submittedByTeam = new Map<string, Set<string>>();
  for (const submission of submissions) {
    const existing = submittedByTeam.get(submission.team_id) ?? new Set();
    existing.add(submission.deliverable_id);
    submittedByTeam.set(submission.team_id, existing);
  }

  const totalDeliverableCount = deliverables.length;

  const teamFundingData: TeamFundingData[] = teams.map((team) => {
    const teamEvents = eventsByTeam.get(team.id) ?? [];
    const dilutiveTotal = teamEvents
      .filter((e) => e.fund_type === 'dilutive')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const nonDilutiveTotal = teamEvents
      .filter((e) => e.fund_type === 'non_dilutive')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Count deliverables applicable to this team
    const applicableDeliverables = deliverables.filter(
      (d) => d.assigned_team_ids === null || (d.assigned_team_ids as string[]).includes(team.id)
    );
    const submittedCount = submittedByTeam.get(team.id)?.size ?? 0;

    return {
      teamId: team.id,
      teamName: team.name,
      milestoneFunding: milestoneByTeam.get(team.id) ?? null,
      fundingEvents: teamEvents,
      dilutiveTotal,
      nonDilutiveTotal,
      submittedDeliverableCount: submittedCount,
      totalDeliverableCount: applicableDeliverables.length,
    };
  });

  return { teamFundingData, teams, totalDeliverableCount };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `$${Number(amount).toLocaleString()}`;
}

function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

function deliverableCompletionPct(submitted: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FundingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role as AccelRole)) {
    redirect('/accelerator/dashboard');
  }

  const role = profile.role as AccelRole;
  const canEdit = role === 'aggiex_team';

  const { teamFundingData, teams } = await fetchFundingPageData();

  const totalExternalFunding = teamFundingData.reduce(
    (sum, t) => sum + t.dilutiveTotal + t.nonDilutiveTotal,
    0
  );
  const totalEvents = teamFundingData.reduce((sum, t) => sum + t.fundingEvents.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Progress</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Funding</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {totalEvents} external funding event{totalEvents !== 1 ? 's' : ''} across{' '}
            {teams.length} team{teams.length !== 1 ? 's' : ''}.
            {totalExternalFunding > 0 && (
              <> {formatCurrency(totalExternalFunding)} total external capital raised.</>
            )}
          </p>
        </div>

        {canEdit && (
          <LogFundingEventPanel
            teams={teams}
            programId={AGGIEX_2026_PROGRAM_ID}
          />
        )}
      </div>

      {/* ── On-track assessment ── */}
      {canEdit && (
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Program Funding Assessment
          </h2>
          <OnTrackAssessmentPanel teamFundingData={teamFundingData} />
        </section>
      )}

      {/* ── Per-team funding breakdown ── */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Team Breakdown
        </h2>

        {teamFundingData.length === 0 ? (
          <p className="rounded-lg border border-neutral-800 px-4 py-12 text-center text-sm text-neutral-500">
            No active teams found.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {teamFundingData.map((team) => {
              const completionPct = deliverableCompletionPct(
                team.submittedDeliverableCount,
                team.totalDeliverableCount
              );
              const milestoneFundingStatus =
                team.milestoneFunding?.funding_status ?? null;

              return (
                <div
                  key={team.teamId}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
                >
                  {/* Team header row */}
                  <div className="flex items-center justify-between gap-4 border-b border-neutral-800 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="truncate text-sm font-medium text-neutral-100">
                        {team.teamName}
                      </h3>
                      {milestoneFundingStatus && (
                        <span
                          className={`text-xs font-medium ${FUNDING_STATUS_COLORS[milestoneFundingStatus]}`}
                        >
                          {FUNDING_STATUS_LABELS[milestoneFundingStatus]}
                        </span>
                      )}
                    </div>

                    {/* Deliverable completion pill */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-neutral-600">
                        {team.submittedDeliverableCount}/{team.totalDeliverableCount} deliverables
                      </span>
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Funding summary row */}
                  <div className="grid grid-cols-2 gap-px border-b border-neutral-800 bg-neutral-800 sm:grid-cols-4">
                    <div className="bg-neutral-900/60 px-4 py-3">
                      <p className="text-xs text-neutral-600">Dilutive raised</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-100">
                        {formatCurrency(team.dilutiveTotal)}
                      </p>
                    </div>
                    <div className="bg-neutral-900/60 px-4 py-3">
                      <p className="text-xs text-neutral-600">Non-dilutive raised</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-100">
                        {formatCurrency(team.nonDilutiveTotal)}
                      </p>
                    </div>
                    <div className="bg-neutral-900/60 px-4 py-3">
                      <p className="text-xs text-neutral-600">Program award (unlocked)</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-100">
                        {team.milestoneFunding
                          ? formatCurrency(team.milestoneFunding.amount_unlocked)
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-neutral-900/60 px-4 py-3">
                      <p className="text-xs text-neutral-600">Total award</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-100">
                        {team.milestoneFunding
                          ? formatCurrency(team.milestoneFunding.total_award)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Funding events list */}
                  {team.fundingEvents.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-neutral-600">
                      No external funding events logged.
                    </p>
                  ) : (
                    <div className="divide-y divide-neutral-800">
                      {team.fundingEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start justify-between gap-4 px-5 py-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${FUND_TYPE_COLORS[event.fund_type]}`}
                              >
                                {FUND_TYPE_LABELS[event.fund_type]}
                              </span>
                              <span className="text-xs text-neutral-300">{event.source}</span>
                            </div>
                            {event.notes && (
                              <p className="mt-1 text-xs text-neutral-600 line-clamp-1">
                                {event.notes}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums text-neutral-100">
                              {formatCurrency(Number(event.amount))}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {formatDate(event.acquired_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
