import Link from 'next/link';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelSubmissionStatus, AccelProgramEvent, AccelMeetingType } from '@/lib/accel-types';

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

interface DeliverableRow {
  id: string;
  title: string;
  submission: { status: AccelSubmissionStatus } | null;
}

interface RecentMeeting {
  id: string;
  meeting_type: string;
  meeting_date: string;
  duration_minutes: number | null;
  attendees: string[] | null;
}

interface FounderDashboardProps {
  data: {
    role: string;
    team: { id: string; name: string } | null;
    currentWeek: { week_number: number; theme: string } | null;
    upcomingEvents: AccelProgramEvent[];
    deliverables: DeliverableRow[];
    recentMeetings: RecentMeeting[];
  } | null;
}

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'bg-neutral-800 text-neutral-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  submitted: 'bg-amber-500/10 text-amber-400',
  under_review: 'bg-purple-500/10 text-purple-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  needs_revision: 'bg-orange-500/10 text-orange-400',
  flagged: 'bg-red-500/10 text-red-400',
};

export default function FounderDashboard({ data }: FounderDashboardProps) {
  if (!data || !data.team) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-neutral-400">
            Your team hasn&apos;t been set up yet. Contact the AggieX team.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const { team, currentWeek, upcomingEvents, deliverables, recentMeetings } = data;

  const approvedCount = deliverables.filter(
    (d) => d.submission?.status === 'approved'
  ).length;

  const submittedCount = deliverables.filter((d) =>
    d.submission?.status && ['submitted', 'under_review', 'approved'].includes(d.submission.status)
  ).length;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          {team.name}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">
          {currentWeek ? `Week ${currentWeek.week_number}` : 'Dashboard'}
        </h1>
        {currentWeek && (
          <p className="mt-0.5 text-sm text-neutral-400">{currentWeek.theme}</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <StatCard
          label="Submitted"
          value={`${submittedCount}/${deliverables.length}`}
        />
        <StatCard label="Approved" value={String(approvedCount)} />
        <StatCard
          label="Remaining"
          value={String(deliverables.length - approvedCount)}
        />
      </div>

      {/* This week's deliverables */}
      {currentWeek && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Week {currentWeek.week_number} Deliverables
            </h2>
            <Link
              href="/accelerator/my-team/deliverables"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              View all →
            </Link>
          </div>

          {deliverables.length === 0 ? (
            <p className="rounded-lg border border-neutral-800 px-4 py-6 text-center text-sm text-neutral-500">
              No deliverables for this week.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {deliverables.map((deliverable) => {
                const status: AccelSubmissionStatus =
                  deliverable.submission?.status ?? 'not_started';

                return (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                  >
                    <span className="text-sm text-neutral-200">{deliverable.title}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
                    >
                      {SUBMISSION_STATUS_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <QuickActionLink href="/accelerator/my-team/daily-report" label="Log Daily Report" />
          <QuickActionLink href="/accelerator/my-team/deliverables" label="Submit Deliverable" />
          <QuickActionLink href="/accelerator/my-team/traction" label="Log Traction" />
          <QuickActionLink href="/accelerator/my-team/meetings" label="Log Meeting" />
          <QuickActionLink href="/accelerator/calendar" label="View Calendar" />
        </div>
      </section>

      {/* Recent meetings */}
      {recentMeetings.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Recent Meetings
            </h2>
            <Link
              href="/accelerator/my-team/meetings"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentMeetings.map((meeting) => {
              const meetingDate = new Date(meeting.meeting_date + 'T00:00:00');
              return (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <span className="text-sm text-neutral-200">
                    {MEETING_TYPE_LABELS[meeting.meeting_type as AccelMeetingType] ?? meeting.meeting_type}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
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
            {upcomingEvents.map((event) => {
              const date = new Date(event.event_date + 'T00:00:00');
              const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-md border border-neutral-800 px-3 py-2.5 text-sm"
                >
                  <span className="w-24 shrink-0 text-xs text-neutral-500">
                    {formattedDate}
                  </span>
                  <span className="text-neutral-200">{event.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 px-4 py-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">{value}</p>
    </div>
  );
}

function QuickActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-neutral-800 px-4 py-3 text-center text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100"
    >
      {label}
    </Link>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {children}
    </div>
  );
}
