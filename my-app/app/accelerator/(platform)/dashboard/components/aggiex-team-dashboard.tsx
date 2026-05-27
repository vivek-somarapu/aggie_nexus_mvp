'use client';

import { useState } from 'react';
import { FUNDING_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelFundingStatus, AccelProgramEvent } from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────

const MENTOR_TIER_LABELS: Record<string, string> = {
  operational: 'Ops',
  domain: 'Domain',
  capital: 'Capital',
};

const FUNDING_STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400',
  paused: 'text-amber-400',
  probation: 'text-red-400',
  exited: 'text-neutral-500',
};

// ─── Types ───────────────────────────────────────────────────

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

interface MentorRow {
  id: string;
  full_name: string;
  email: string;
  accel_mentor_assignments: Array<{
    team_id: string;
    tier: string;
    accel_teams: { name: string } | null;
  }>;
}

interface NextLockedWeek {
  id: string;
  week_number: number;
  theme: string;
}

interface AggiexTeamDashboardProps {
  data: {
    role: string;
    teams: TeamRow[];
    currentWeek: { week_number: number; theme: string } | null;
    upcomingEvents: AccelProgramEvent[];
    submissionSummary: SubmissionSummary[];
    mentors: MentorRow[];
    nextLockedWeek: NextLockedWeek | null;
  } | null;
}

// ─── Component ───────────────────────────────────────────────

export default function AggiexTeamDashboard({ data }: AggiexTeamDashboardProps) {
  if (!data) {
    return <DashboardShell><EmptyState message="No data available." /></DashboardShell>;
  }

  const { teams, currentWeek, upcomingEvents, submissionSummary, mentors, nextLockedWeek } = data;

  const submissionByTeam = Object.fromEntries(
    submissionSummary.map((s) => [s.team_id, s])
  );

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">AggieX Summer 2026</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Program Dashboard</h1>
        {currentWeek && (
          <p className="mt-0.5 text-sm text-neutral-400">
            Week {currentWeek.week_number} — {currentWeek.theme}
          </p>
        )}
      </div>

      {/* Week advance */}
      {nextLockedWeek && (
        <section className="mb-8">
          <UnlockWeekBanner week={nextLockedWeek} />
        </section>
      )}

      {/* Team status grid */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Teams — Week {currentWeek?.week_number ?? '—'} Status
        </h2>

        {teams.length === 0 ? (
          <EmptyState message="No teams in this cohort yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Deliverables</th>
                  <th className="px-4 py-3 font-medium">Funding</th>
                  <th className="px-4 py-3 font-medium">Crucible</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {teams.map((team) => {
                  const submission = submissionByTeam[team.id];
                  const funding = team.accel_milestone_funding?.[0];
                  const fundingStatus = funding?.funding_status ?? 'on_track';

                  return (
                    <tr key={team.id} className="transition-colors hover:bg-neutral-900/50">
                      <td className="px-4 py-3 font-medium text-neutral-100">{team.name}</td>
                      <td className="px-4 py-3">
                        {submission ? (
                          <ProgressPill
                            submitted={submission.submitted_count}
                            total={submission.total_count}
                          />
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {funding ? (
                          <span className={`text-xs font-medium ${FUNDING_STATUS_COLORS[fundingStatus]}`}>
                            {FUNDING_STATUS_LABELS[fundingStatus]}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {team.crucible_outcome ? (
                          <CrucibleBadge outcome={team.crucible_outcome} />
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {submission?.has_flagged ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            Flagged
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
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

      {/* Mentor roster */}
      {mentors.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Mentors ({mentors.length})
          </h2>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {mentors.map((mentor) => {
                  const assignments = mentor.accel_mentor_assignments ?? [];
                  const tier = assignments[0]?.tier;

                  return (
                    <tr key={mentor.id} className="hover:bg-neutral-900/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-100">{mentor.full_name}</p>
                        <p className="text-xs text-neutral-500">{mentor.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tier && (
                            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                              {MENTOR_TIER_LABELS[tier] ?? tier}
                            </span>
                          )}
                          {assignments.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                              Generalist
                            </span>
                          ) : (
                            assignments.map((assignment) => (
                              <span
                                key={assignment.team_id}
                                className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300"
                              >
                                {assignment.accel_teams?.name ?? 'Unknown'}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Upcoming
          </h2>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function ProgressPill({ submitted, total }: { submitted: number; total: number }) {
  const pct = total > 0 ? (submitted / total) * 100 : 0;
  const isComplete = submitted >= total;

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
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize ${colors[outcome] ?? 'bg-neutral-800 text-neutral-400'}`}>
      {outcome}
    </span>
  );
}

function EventRow({ event }: { event: AccelProgramEvent }) {
  const date = new Date(event.event_date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-800 px-3 py-2.5 text-sm">
      <span className="w-24 shrink-0 text-xs text-neutral-500">{formattedDate}</span>
      <span className="text-neutral-200">{event.title}</span>
      {event.is_mandatory && (
        <span className="ml-auto shrink-0 text-xs text-neutral-600">Mandatory</span>
      )}
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-neutral-800 px-4 py-8 text-center text-sm text-neutral-500">
      {message}
    </p>
  );
}

function UnlockWeekBanner({ week }: { week: NextLockedWeek }) {
  const [isPending, setIsPending] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlock = async () => {
    setIsPending(true);
    const response = await fetch(`/api/accelerator/weeks/${week.id}/unlock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_unlocked: true }),
    });
    setIsPending(false);
    if (response.ok) setIsUnlocked(true);
  };

  if (isUnlocked) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <p className="text-sm text-emerald-400">
          Week {week.week_number} — {week.theme} is now live.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Next up</p>
        <p className="mt-0.5 text-sm text-neutral-200">
          Week {week.week_number} — {week.theme}
        </p>
      </div>
      <button
        onClick={unlock}
        disabled={isPending}
        className="rounded-md bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {isPending ? 'Unlocking...' : 'Unlock week'}
      </button>
    </div>
  );
}
