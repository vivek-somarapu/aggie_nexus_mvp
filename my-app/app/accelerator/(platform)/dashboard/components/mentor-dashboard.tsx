import Link from 'next/link';
import type { AccelProgramEvent, AccelMeetingType } from '@/lib/accel-types';

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

interface AssignmentRow {
  id: string;
  tier: string;
  assigned_weeks: number[] | null;
  accel_teams: { id: string; name: string } | null;
}

interface RecentMeetingRow {
  id: string;
  team_id: string;
  meeting_type: string;
  meeting_date: string;
  accel_teams: { name: string } | null;
}

interface MentorDashboardProps {
  data: {
    role: string;
    assignments: AssignmentRow[];
    currentWeek: { week_number: number; theme: string } | null;
    upcomingEvents: AccelProgramEvent[];
    recentMeetings: RecentMeetingRow[];
  } | null;
}

export default function MentorDashboard({ data }: MentorDashboardProps) {
  if (!data) {
    return (
      <DashboardShell>
        <EmptyState message="No data available." />
      </DashboardShell>
    );
  }

  const { assignments, currentWeek, upcomingEvents, recentMeetings } = data;

  const activeAssignments = assignments.filter((a) => {
    if (!a.assigned_weeks || !currentWeek) return true;
    return a.assigned_weeks.includes(currentWeek.week_number);
  });

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Mentor</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">
          {currentWeek ? `Week ${currentWeek.week_number}` : 'Dashboard'}
        </h1>
        {currentWeek && (
          <p className="mt-0.5 text-sm text-neutral-400">{currentWeek.theme}</p>
        )}
      </div>

      {/* Assigned teams this week */}
      <section className="mb-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
          Your Teams {currentWeek ? `— Week ${currentWeek.week_number}` : ''}
        </h2>

        {activeAssignments.length === 0 ? (
          <EmptyState message="No active team assignments for this week." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {activeAssignments.map((assignment) => {
              if (!assignment.accel_teams) return null;
              const team = assignment.accel_teams;

              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-100">{team.name}</p>
                    <p className="mt-0.5 text-xs capitalize text-neutral-500">
                      {assignment.tier} mentor
                    </p>
                  </div>
                  <Link
                    href={`/accelerator/teams/${team.id}`}
                    className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                  >
                    View →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending assessments prompt */}
      {currentWeek && activeAssignments.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Pending Assessments
          </h2>
          <div className="flex flex-col gap-1.5">
            {activeAssignments.map((assignment) => {
              if (!assignment.accel_teams) return null;
              return (
                <Link
                  key={assignment.id}
                  href={`/accelerator/teams/${assignment.accel_teams.id}/assess`}
                  className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm transition-colors hover:border-amber-500/40"
                >
                  <span className="text-neutral-200">{assignment.accel_teams.name}</span>
                  <span className="text-xs text-amber-400">Submit Week {currentWeek.week_number} assessment →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent meetings */}
      {recentMeetings.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Recent Meetings
            </h2>
            <Link
              href="/accelerator/meetings"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentMeetings.map((meeting) => {
              const meetingDate = new Date(meeting.meeting_date + 'T00:00:00');
              const teamName = meeting.accel_teams?.name;
              return (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-neutral-200">
                      {MEETING_TYPE_LABELS[meeting.meeting_type as AccelMeetingType] ?? meeting.meeting_type}
                    </p>
                    {teamName && (
                      <p className="mt-0.5 text-xs text-neutral-500">{teamName}</p>
                    )}
                  </div>
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

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
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
