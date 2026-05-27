import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { FUNDING_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelFundingStatus, AccelProgramEvent } from '@/lib/accel-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FUNDING_STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400',
  paused: 'text-amber-400',
  probation: 'text-red-400',
  exited: 'text-neutral-500',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubmissionSummary {
  team_id: string;
  submitted_count: number;
  total_count: number;
  has_flagged: boolean;
}

interface TeamRow {
  id: string;
  name: string;
  is_active: boolean;
  crucible_outcome: string | null;
  accel_milestone_funding?: Array<{
    funding_status: AccelFundingStatus;
    amount_unlocked: number;
    total_award: number;
  }>;
}

interface MceStaffDashboardProps {
  data: {
    role: string;
    teams: TeamRow[];
    currentWeek: { week_number: number; theme: string } | null;
    upcomingEvents: AccelProgramEvent[];
    submissionSummary: SubmissionSummary[];
    mentors: Array<{ id: string; full_name: string }>;
    nextLockedWeek: { week_number: number; theme: string } | null;
  } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MceStaffDashboard({ data }: MceStaffDashboardProps) {
  if (!data) {
    return (
      <Shell>
        <p className="text-sm text-neutral-500 text-center py-20">No data available.</p>
      </Shell>
    );
  }

  const { teams, currentWeek, upcomingEvents, submissionSummary, mentors, nextLockedWeek } = data;

  const submissionByTeam = Object.fromEntries(
    submissionSummary.map((s) => [s.team_id, s])
  );

  const totalTeams = teams.length;
  const flaggedTeams = submissionSummary.filter((s) => s.has_flagged).length;
  const fullySubmittedTeams = submissionSummary.filter(
    (s) => s.total_count > 0 && s.submitted_count >= s.total_count
  ).length;

  return (
    <Shell>
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">MCE Staff · Observer View</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Cohort Overview</h1>
        {currentWeek && (
          <p className="mt-0.5 text-sm text-neutral-400">
            Week {currentWeek.week_number} — {currentWeek.theme}
          </p>
        )}
      </div>

      {/* ── Cohort health stats ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Teams" value={String(totalTeams)} />
        <StatCard label="Fully submitted" value={String(fullySubmittedTeams)} color="text-emerald-400" />
        <StatCard
          label="Flagged"
          value={String(flaggedTeams)}
          color={flaggedTeams > 0 ? 'text-red-400' : 'text-neutral-500'}
        />
        <StatCard label="Mentors" value={String(mentors.length)} color="text-purple-400" />
      </div>

      {/* ── Next week notice (read-only) ── */}
      {nextLockedWeek && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-600">Next up</p>
            <p className="mt-0.5 text-sm text-neutral-400">
              Week {nextLockedWeek.week_number} — {nextLockedWeek.theme} (locked)
            </p>
          </div>
          <p className="ml-auto text-xs text-neutral-700">AggieX team controls unlock</p>
        </div>
      )}

      {/* ── Team status table ── */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            Teams — Week {currentWeek?.week_number ?? '—'} Progress
          </h2>
          <Link
            href="/accelerator/teams"
            className="text-xs text-neutral-600 transition-colors hover:text-neutral-300"
          >
            Team profiles →
          </Link>
        </div>

        {teams.length === 0 ? (
          <p className="rounded-lg border border-neutral-800 px-4 py-10 text-center text-sm text-neutral-600">
            No teams in this cohort yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-600">
                  <th className="px-4 py-2.5 font-medium">Team</th>
                  <th className="px-4 py-2.5 font-medium">Deliverables</th>
                  <th className="px-4 py-2.5 font-medium">Funding status</th>
                  <th className="px-4 py-2.5 font-medium">Crucible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {teams.map((team) => {
                  const submission = submissionByTeam[team.id];
                  const funding = team.accel_milestone_funding?.[0];
                  const fundingStatus = funding?.funding_status ?? null;

                  return (
                    <tr
                      key={team.id}
                      className="transition-colors hover:bg-neutral-900/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-200">{team.name}</p>
                        {submission?.has_flagged && (
                          <p className="text-[10px] text-red-400">⚑ Flagged submission</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {submission ? (
                          <ProgressBar
                            submitted={submission.submitted_count}
                            total={submission.total_count}
                          />
                        ) : (
                          <span className="text-neutral-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {fundingStatus ? (
                          <span
                            className={`text-xs font-medium ${FUNDING_STATUS_COLORS[fundingStatus]}`}
                          >
                            {FUNDING_STATUS_LABELS[fundingStatus]}
                          </span>
                        ) : (
                          <span className="text-neutral-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {team.crucible_outcome ? (
                          <CrucibleBadge outcome={team.crucible_outcome} />
                        ) : (
                          <span className="text-neutral-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Upcoming events ── */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Upcoming
          </h2>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-md border border-neutral-800 px-3 py-2.5 text-sm"
              >
                <span className="w-28 shrink-0 text-xs text-neutral-500">
                  {format(parseISO(event.event_date), 'EEE, MMM d')}
                </span>
                <span className="text-neutral-300">{event.title}</span>
                {event.is_mandatory && (
                  <span className="ml-auto shrink-0 text-xs text-neutral-700">Mandatory</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>;
}

function StatCard({
  label,
  value,
  color = 'text-neutral-100',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 px-4 py-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function ProgressBar({ submitted, total }: { submitted: number; total: number }) {
  const pct = total > 0 ? (submitted / total) * 100 : 0;
  const isComplete = submitted >= total && total > 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs tabular-nums ${isComplete ? 'text-emerald-400' : 'text-neutral-400'}`}>
        {submitted}/{total}
      </span>
    </div>
  );
}

function CrucibleBadge({ outcome }: { outcome: string }) {
  const colors: Record<string, string> = {
    accelerate: 'bg-emerald-500/10 text-emerald-400',
    refine: 'bg-amber-500/10 text-amber-400',
    restructure: 'bg-red-500/10 text-red-400',
  };
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize ${colors[outcome] ?? 'bg-neutral-800 text-neutral-400'}`}
    >
      {outcome}
    </span>
  );
}
