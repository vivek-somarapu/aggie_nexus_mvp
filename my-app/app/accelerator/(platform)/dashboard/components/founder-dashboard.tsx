import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Link2,
  BookOpen,
  TrendingUp,
  Users,
  CalendarDays,
} from 'lucide-react';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelSubmissionStatus, AccelProgramEvent, AccelMeetingType, AccelCurriculumFileType } from '@/lib/accel-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

const FILE_TYPE_ICONS: Record<AccelCurriculumFileType, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  video_link: Link2,
  external_link: Link2,
  other: FileText,
};

const STATUS_STYLES: Record<
  AccelSubmissionStatus,
  { badge: string; icon: React.ElementType; iconColor: string }
> = {
  not_started: {
    badge: 'bg-neutral-800 text-neutral-500',
    icon: Circle,
    iconColor: 'text-neutral-700',
  },
  in_progress: {
    badge: 'bg-blue-500/10 text-blue-400',
    icon: Clock,
    iconColor: 'text-blue-400',
  },
  submitted: {
    badge: 'bg-amber-500/10 text-amber-400',
    icon: Clock,
    iconColor: 'text-amber-400',
  },
  under_review: {
    badge: 'bg-purple-500/10 text-purple-400',
    icon: Clock,
    iconColor: 'text-purple-400',
  },
  approved: {
    badge: 'bg-emerald-500/10 text-emerald-400',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  needs_revision: {
    badge: 'bg-orange-500/10 text-orange-400',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
  },
  flagged: {
    badge: 'bg-red-500/10 text-red-400',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
};

const MENTOR_TIER_STYLES: Record<string, string> = {
  operational: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  domain: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  capital: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

const MENTOR_TIER_LABELS: Record<string, string> = {
  operational: 'Operational',
  domain: 'Domain',
  capital: 'Capital',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeliverableRow {
  id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  expected_format: string;
  submission: {
    id: string;
    status: string;
    text_content: string | null;
    version: number;
    submitted_at: string | null;
  } | null;
  feedback: string | null;
}

interface MentorAssignment {
  id: string;
  mentor_id: string;
  tier: string;
  assigned_weeks: number[] | null;
  accel_profiles: { full_name: string; email: string } | null;
}

interface CurriculumFile {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
}

interface FounderDashboardProps {
  data: {
    role: string;
    team: { id: string; name: string } | null;
    currentWeek: { id: string; week_number: number; theme: string } | null;
    upcomingEvents: AccelProgramEvent[];
    deliverables: DeliverableRow[];
    recentMeetings: Array<{
      id: string;
      meeting_type: string;
      meeting_date: string;
      duration_minutes: number | null;
    }>;
    mentorAssignments: MentorAssignment[];
    tractionEntryCount: number;
    curriculumFiles: CurriculumFile[];
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derivePriorityAction(deliverables: DeliverableRow[]): {
  label: string;
  sublabel: string;
  href: string;
  urgency: 'high' | 'medium' | 'low';
} {
  const needsRevision = deliverables.filter(
    (d) => d.submission?.status === 'needs_revision' || d.submission?.status === 'flagged'
  );
  if (needsRevision.length > 0) {
    return {
      label: `${needsRevision.length} deliverable${needsRevision.length > 1 ? 's' : ''} need${needsRevision.length === 1 ? 's' : ''} revision`,
      sublabel: `"${needsRevision[0].title}" has feedback from AggieX waiting for you.`,
      href: '/accelerator/my-team/deliverables',
      urgency: 'high',
    };
  }

  const notStarted = deliverables.filter(
    (d) => !d.submission || d.submission.status === 'not_started'
  );
  const required = notStarted.filter((d) => d.is_required);

  if (required.length > 0) {
    return {
      label: `${required.length} required deliverable${required.length > 1 ? 's' : ''} outstanding`,
      sublabel: `Start with "${required[0].title}" to stay on track.`,
      href: '/accelerator/my-team/deliverables',
      urgency: 'medium',
    };
  }

  if (notStarted.length > 0) {
    return {
      label: `${notStarted.length} deliverable${notStarted.length > 1 ? 's' : ''} not yet started`,
      sublabel: 'Submit them to keep your team fully on track.',
      href: '/accelerator/my-team/deliverables',
      urgency: 'low',
    };
  }

  return {
    label: "You're all caught up this week",
    sublabel: 'All deliverables submitted. Log traction to show your momentum.',
    href: '/accelerator/my-team/traction',
    urgency: 'low',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FounderDashboard({ data }: FounderDashboardProps) {
  if (!data || !data.team) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-neutral-400">
            Your team hasn&apos;t been set up yet. Contact the AggieX team.
          </p>
        </div>
      </Shell>
    );
  }

  const {
    team,
    currentWeek,
    upcomingEvents,
    deliverables,
    recentMeetings,
    mentorAssignments,
    tractionEntryCount,
    curriculumFiles,
  } = data;

  const approvedCount = deliverables.filter((d) => d.submission?.status === 'approved').length;
  const needsRevisionCount = deliverables.filter(
    (d) => d.submission?.status === 'needs_revision' || d.submission?.status === 'flagged'
  ).length;
  const notStartedCount = deliverables.filter(
    (d) => !d.submission || d.submission.status === 'not_started'
  ).length;

  const priority = derivePriorityAction(deliverables);

  const urgencyStyles = {
    high: 'border-orange-500/40 bg-orange-500/5',
    medium: 'border-amber-500/30 bg-amber-500/5',
    low: 'border-emerald-500/30 bg-emerald-500/5',
  };

  const urgencyTextStyles = {
    high: 'text-orange-300',
    medium: 'text-amber-300',
    low: 'text-emerald-300',
  };

  return (
    <Shell>
      {/* ── Header ── */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{team.name}</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">
          {currentWeek ? `Week ${currentWeek.week_number}` : 'Dashboard'}
        </h1>
        {currentWeek && (
          <p className="mt-0.5 text-sm text-neutral-400">{currentWeek.theme}</p>
        )}
      </div>

      {/* ── Priority action ── */}
      <section className="mb-6">
        <Link
          href={priority.href}
          className={`flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors hover:brightness-110 ${urgencyStyles[priority.urgency]}`}
        >
          <div>
            <p className={`text-sm font-medium ${urgencyTextStyles[priority.urgency]}`}>
              {priority.label}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">{priority.sublabel}</p>
          </div>
          <ArrowRight size={15} className="shrink-0 text-neutral-600" />
        </Link>
      </section>

      {/* ── Stats row ── */}
      <div className="mb-8 grid grid-cols-4 gap-2">
        <StatCard label="Approved" value={String(approvedCount)} color="text-emerald-400" />
        <StatCard
          label="Needs revision"
          value={String(needsRevisionCount)}
          color={needsRevisionCount > 0 ? 'text-orange-400' : 'text-neutral-500'}
        />
        <StatCard label="Not started" value={String(notStartedCount)} color="text-neutral-400" />
        <StatCard label="Traction entries" value={String(tractionEntryCount)} color="text-blue-400" />
      </div>

      {/* ── Deliverables ── */}
      {currentWeek && (
        <section className="mb-8">
          <SectionHeader
            label={`Week ${currentWeek.week_number} Deliverables`}
            linkHref="/accelerator/my-team/deliverables"
            linkLabel="Submit / view all →"
          />

          {deliverables.length === 0 ? (
            <EmptyCard message="No deliverables for this week." />
          ) : (
            <div className="flex flex-col gap-2">
              {deliverables.map((deliverable) => {
                const status = (deliverable.submission?.status ?? 'not_started') as AccelSubmissionStatus;
                const style = STATUS_STYLES[status];
                const Icon = style.icon;
                const isActionable =
                  status === 'needs_revision' || status === 'flagged' || status === 'not_started';

                return (
                  <Link
                    key={deliverable.id}
                    href="/accelerator/my-team/deliverables"
                    className={[
                      'rounded-lg border transition-colors',
                      isActionable
                        ? 'border-neutral-700 hover:border-neutral-600'
                        : 'border-neutral-800',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={14} className={`shrink-0 ${style.iconColor}`} />
                        <span className="truncate text-sm text-neutral-200">
                          {deliverable.title}
                        </span>
                        {deliverable.is_required && (
                          <span className="shrink-0 text-xs text-neutral-700">Required</span>
                        )}
                      </div>
                      <span
                        className={`ml-3 shrink-0 rounded px-2 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        {SUBMISSION_STATUS_LABELS[status]}
                      </span>
                    </div>

                    {/* Feedback banner */}
                    {deliverable.feedback &&
                      (status === 'needs_revision' || status === 'flagged') && (
                        <div className="border-t border-orange-500/20 bg-orange-500/5 px-4 py-2.5">
                          <p className="text-xs font-medium text-orange-400">
                            Feedback from AggieX
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">
                            {deliverable.feedback}
                          </p>
                        </div>
                      )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Mentors ── */}
      {mentorAssignments.length > 0 && (
        <section className="mb-8">
          <SectionHeader label="Your Mentors" />
          <div className="flex flex-col gap-2">
            {mentorAssignments.map((assignment) => {
              const name = assignment.accel_profiles?.full_name ?? 'Unknown';
              const email = assignment.accel_profiles?.email;
              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Users size={14} className="shrink-0 text-neutral-600" />
                    <div>
                      <p className="text-sm text-neutral-200">{name}</p>
                      {email && (
                        <p className="text-xs text-neutral-600">{email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.assigned_weeks && assignment.assigned_weeks.length > 0 && (
                      <span className="text-xs text-neutral-600">
                        Wks {assignment.assigned_weeks.join(', ')}
                      </span>
                    )}
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${MENTOR_TIER_STYLES[assignment.tier] ?? 'text-neutral-400 bg-neutral-800 border-neutral-700'}`}
                    >
                      {MENTOR_TIER_LABELS[assignment.tier] ?? assignment.tier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Curriculum ── */}
      {curriculumFiles.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            label={`Week ${currentWeek?.week_number ?? '—'} Curriculum`}
            linkHref="/accelerator/curriculum"
            linkLabel="View all →"
          />
          <div className="flex flex-col gap-1.5">
            {curriculumFiles.map((file) => {
              const Icon = FILE_TYPE_ICONS[file.file_type as AccelCurriculumFileType] ?? FileText;
              return (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-md border border-neutral-800 px-4 py-3 transition-colors hover:border-neutral-700 hover:bg-neutral-900/40"
                >
                  <Icon size={14} className="shrink-0 text-neutral-500" />
                  <span className="text-sm text-neutral-300">{file.title}</span>
                  <span className="ml-auto text-xs uppercase tracking-wider text-neutral-700">
                    {file.file_type.replace('_', ' ')}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Upcoming events ── */}
      {upcomingEvents.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            label="Upcoming"
            linkHref="/accelerator/calendar"
            linkLabel="Full calendar →"
          />
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-md border border-neutral-800 px-3 py-2.5"
              >
                <CalendarDays size={13} className="shrink-0 text-neutral-600" />
                <span className="w-28 shrink-0 text-xs text-neutral-500">
                  {format(parseISO(event.event_date), 'EEE, MMM d')}
                </span>
                <span className="truncate text-sm text-neutral-200">{event.title}</span>
                {event.is_mandatory && (
                  <span className="ml-auto shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                    Mandatory
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent meetings ── */}
      {recentMeetings.length > 0 && (
        <section className="mb-8">
          <SectionHeader
            label="Recent Meetings"
            linkHref="/accelerator/my-team/meetings"
            linkLabel="View all →"
          />
          <div className="flex flex-col gap-1.5">
            {recentMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-2.5"
              >
                <span className="text-sm text-neutral-200">
                  {MEETING_TYPE_LABELS[meeting.meeting_type as AccelMeetingType] ??
                    meeting.meeting_type}
                </span>
                <span className="text-xs text-neutral-500">
                  {format(parseISO(meeting.meeting_date), 'MMM d, yyyy')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick actions ── */}
      <section>
        <SectionHeader label="Quick Actions" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction href="/accelerator/my-team/deliverables" icon={CheckCircle2} label="Deliverables" />
          <QuickAction href="/accelerator/my-team/traction" icon={TrendingUp} label="Log Traction" />
          <QuickAction href="/accelerator/my-team/meetings" icon={Users} label="Log Meeting" />
          <QuickAction href="/accelerator/curriculum" icon={BookOpen} label="Curriculum" />
        </div>
      </section>
    </Shell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6 py-8">{children}</div>;
}

function SectionHeader({
  label,
  linkHref,
  linkLabel,
}: {
  label: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xs font-medium uppercase tracking-widest text-neutral-500">{label}</h2>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="text-xs text-neutral-600 transition-colors hover:text-neutral-300"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 px-3 py-3">
      <p className="text-[10px] text-neutral-600">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md border border-neutral-800 px-3 py-3 text-sm text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200"
    >
      <Icon size={14} className="shrink-0" />
      {label}
    </Link>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-neutral-800 px-4 py-8 text-center text-sm text-neutral-600">
      {message}
    </p>
  );
}
