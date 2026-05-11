'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarCurrentDate,
  CalendarMonthView,
  CalendarTodayTrigger,
  CalendarPrevTrigger,
  CalendarNextTrigger,
  type CalendarEvent,
} from '@/components/ui/full-calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  AccelRole,
  AccelEventType,
  AccelProgramEvent,
  AccelSubmissionStatus,
  AccelCurriculumFileType,
} from '@/lib/accel-types';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CalendarWeek {
  id: string;
  week_number: number;
  theme: string;
  start_date: string;
  end_date: string;
  demo_day_date: string | null;
  is_crucible: boolean;
  is_unlocked: boolean;
  deliverables: CalendarDeliverable[];
}

export interface CalendarDeliverable {
  id: string;
  title: string;
  is_required: boolean;
  submissionStatus: AccelSubmissionStatus | null;
  submittedTeamCount?: number;
  totalTeamCount?: number;
}

export interface CalendarCurriculumFile {
  id: string;
  title: string;
  file_type: AccelCurriculumFileType;
  file_url: string;
  week_start_date: string | null; // null = program-wide (no date anchor)
  week_number: number | null;
}

interface AcceleratorCalendarViewProps {
  role: AccelRole;
  weeks: CalendarWeek[];
  programEvents: AccelProgramEvent[];
  curriculumFiles: CalendarCurriculumFile[];
  todayStr: string;
}

// ─── Color maps ───────────────────────────────────────────────────────────────

const EVENT_TYPE_COLORS: Partial<Record<AccelEventType, CalendarEvent['color']>> = {
  week_start: 'emerald',
  week_end: 'rose',
  demo_day: 'purple',
  crucible: 'red',
  speaker_day: 'blue',
  mentor_day: 'teal',
  off_day: 'default',
  social_event: 'yellow',
  final_demo_day: 'orange',
  program_close: 'pink',
  one_on_one: 'indigo',
};

const FILE_TYPE_LABELS: Record<AccelCurriculumFileType, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  video_link: 'Video',
  external_link: 'Link',
  other: 'File',
};

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'bg-neutral-800 text-neutral-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  submitted: 'bg-amber-500/10 text-amber-400',
  under_review: 'bg-purple-500/10 text-purple-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  needs_revision: 'bg-orange-500/10 text-orange-400',
  flagged: 'bg-red-500/10 text-red-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function toAllDayEvent(id: string, title: string, dateStr: string, color: CalendarEvent['color']): CalendarEvent {
  const start = new Date(dateStr + 'T08:00:00');
  const end = new Date(dateStr + 'T09:00:00');
  return { id, title, start, end, color };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AcceleratorCalendarView({
  role,
  weeks,
  programEvents,
  curriculumFiles,
  todayStr,
}: AcceleratorCalendarViewProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const isFounder = role === 'founder';

  // Build calendar events from all three sources
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Program events
    for (const event of programEvents) {
      events.push(
        toAllDayEvent(
          event.id,
          event.title,
          event.event_date,
          EVENT_TYPE_COLORS[event.event_type as AccelEventType] ?? 'default',
        )
      );
    }

    // Deliverable due dates — one entry per week on end_date
    for (const week of weeks) {
      if (week.deliverables.length > 0) {
        events.push(
          toAllDayEvent(
            `due-${week.id}`,
            `Week ${week.week_number} deliverables due`,
            week.end_date,
            'amber',
          )
        );
      }
    }

    // Curriculum resources — appear on their week's start date
    for (const file of curriculumFiles) {
      if (!file.week_start_date) continue; // skip program-wide files (no date anchor)
      events.push(
        toAllDayEvent(
          `curriculum-${file.id}`,
          `${FILE_TYPE_LABELS[file.file_type]}: ${file.title}`,
          file.week_start_date,
          'indigo',
        )
      );
    }

    return events;
  }, [programEvents, weeks, curriculumFiles]);

  return (
    <div>
      {/* View toggle */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex rounded-md border border-neutral-800 p-0.5">
          <button
            onClick={() => setView('list')}
            className={[
              'rounded px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'list'
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300',
            ].join(' ')}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={[
              'rounded px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'calendar'
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300',
            ].join(' ')}
          >
            Calendar
          </button>
        </div>

        {/* Legend */}
        <div className="ml-4 hidden items-center gap-3 sm:flex">
          <LegendDot color="bg-amber-500" label="Due date" />
          <LegendDot color="bg-indigo-500" label="Curriculum" />
          <LegendDot color="bg-emerald-500" label="Week start" />
          <LegendDot color="bg-purple-500" label="Demo day" />
          <LegendDot color="bg-red-500" label="Crucible" />
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView events={calendarEvents} />
      ) : (
        <ListView
          weeks={weeks}
          programEvents={programEvents}
          curriculumFiles={curriculumFiles}
          isFounder={isFounder}
          todayStr={todayStr}
        />
      )}
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ events }: { events: CalendarEvent[] }) {
  return (
    <Calendar events={events} view="month">
      <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-800">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
          <div className="relative flex flex-1 items-center justify-center">
            <CalendarCurrentDate className="pointer-events-none select-none text-lg font-semibold text-neutral-100" />
          </div>
          <div className="flex gap-1">
            <CalendarPrevTrigger className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100">
              <ChevronLeft size={15} />
              <span className="sr-only">Previous</span>
            </CalendarPrevTrigger>
            <CalendarTodayTrigger className="rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100">
              Today
            </CalendarTodayTrigger>
            <CalendarNextTrigger className="rounded p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100">
              <ChevronRight size={15} />
              <span className="sr-only">Next</span>
            </CalendarNextTrigger>
          </div>
        </div>

        {/* Month grid */}
        <div className="overflow-hidden">
          <CalendarMonthView />
        </div>
      </div>
    </Calendar>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

interface ListViewProps {
  weeks: CalendarWeek[];
  programEvents: AccelProgramEvent[];
  curriculumFiles: CalendarCurriculumFile[];
  isFounder: boolean;
  todayStr: string;
}

function ListView({ weeks, programEvents, curriculumFiles, isFounder, todayStr }: ListViewProps) {
  // Index curriculum by week_number for display in week sections
  const curriculumByWeek = useMemo(() => {
    const map = new Map<number, CalendarCurriculumFile[]>();
    for (const file of curriculumFiles) {
      if (file.week_number === null) continue;
      const existing = map.get(file.week_number) ?? [];
      existing.push(file);
      map.set(file.week_number, existing);
    }
    return map;
  }, [curriculumFiles]);

  // Program-wide curriculum (no week)
  const programWideCurriculum = curriculumFiles.filter((f) => f.week_number === null);

  // Upcoming events not tied to a specific week
  const upcomingEvents = programEvents
    .filter((e) => e.event_date >= todayStr)
    .slice(0, 8);

  if (weeks.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-800 px-4 py-12 text-center text-sm text-neutral-500">
        No weeks unlocked yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Upcoming events strip */}
      {upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Upcoming Events
          </h2>
          <div className="flex flex-col gap-1.5">
            {upcomingEvents.map((event) => {
              const isToday = event.event_date === todayStr;
              return (
                <div
                  key={event.id}
                  className={[
                    'flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm',
                    isToday
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-neutral-800',
                  ].join(' ')}
                >
                  <span className="w-20 shrink-0 text-xs text-neutral-500">
                    {isToday ? 'Today' : formatDate(event.event_date)}
                  </span>
                  <span className={isToday ? 'text-amber-300' : 'text-neutral-200'}>
                    {event.title}
                  </span>
                  {event.is_mandatory && (
                    <span className="ml-auto shrink-0 text-xs text-red-400">Required</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Program-wide curriculum */}
      {programWideCurriculum.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Program Resources
          </h2>
          <div className="flex flex-col gap-1.5">
            {programWideCurriculum.map((file) => (
              <CurriculumRow key={file.id} file={file} />
            ))}
          </div>
        </section>
      )}

      {/* Weekly sections */}
      {weeks.map((week) => {
        const isActive = week.start_date <= todayStr && todayStr <= week.end_date;
        const isPast = week.end_date < todayStr;
        const weekCurriculum = curriculumByWeek.get(week.week_number) ?? [];

        const approvedCount = isFounder
          ? week.deliverables.filter((d) => d.submissionStatus === 'approved').length
          : 0;
        const submittedCount = isFounder
          ? week.deliverables.filter(
              (d) => d.submissionStatus && ['submitted', 'under_review', 'approved'].includes(d.submissionStatus)
            ).length
          : 0;

        return (
          <section key={week.id}>
            {/* Week header */}
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-100">
                Week {week.week_number}
                <span className="ml-2 font-normal text-neutral-500">{week.theme}</span>
              </h3>
              {isActive && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Current
                </span>
              )}
              {isPast && (
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-500">
                  Past
                </span>
              )}
              {!isActive && !isPast && (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                  Upcoming
                </span>
              )}
            </div>

            <p className="mb-3 text-xs text-neutral-600">
              {formatDate(week.start_date)} – {formatDate(week.end_date)}
              {week.demo_day_date && ` · Demo ${formatDate(week.demo_day_date)}`}
              {week.is_crucible && ' · Crucible'}
            </p>

            {/* Founder progress summary */}
            {isFounder && week.deliverables.length > 0 && (
              <p className="mb-2 text-xs text-neutral-500">
                {submittedCount}/{week.deliverables.length} submitted
                {approvedCount > 0 && `, ${approvedCount} approved`}
              </p>
            )}

            {/* Deliverables */}
            {week.deliverables.length > 0 && (
              <div className="mb-3 flex flex-col gap-1.5">
                {week.deliverables.map((deliverable) => (
                  <DeliverableRow
                    key={deliverable.id}
                    deliverable={deliverable}
                    isFounder={isFounder}
                  />
                ))}
              </div>
            )}

            {/* Curriculum for this week */}
            {weekCurriculum.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {weekCurriculum.map((file) => (
                  <CurriculumRow key={file.id} file={file} />
                ))}
              </div>
            )}

            {week.deliverables.length === 0 && weekCurriculum.length === 0 && (
              <p className="text-xs text-neutral-600">No deliverables or resources for this week.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ─── Row sub-components ───────────────────────────────────────────────────────

function DeliverableRow({
  deliverable,
  isFounder,
}: {
  deliverable: CalendarDeliverable;
  isFounder: boolean;
}) {
  if (isFounder) {
    const status: AccelSubmissionStatus = deliverable.submissionStatus ?? 'not_started';
    return (
      <div className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm text-neutral-200">{deliverable.title}</p>
          {!deliverable.is_required && (
            <p className="text-xs text-neutral-600">Optional</p>
          )}
        </div>
        <span className={`ml-3 shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
          {SUBMISSION_STATUS_LABELS[status]}
        </span>
      </div>
    );
  }

  // Admin / mentor: submission count bar
  const submitted = deliverable.submittedTeamCount ?? 0;
  const total = deliverable.totalTeamCount ?? 0;
  const allSubmitted = total > 0 && submitted === total;
  const noneSubmitted = submitted === 0;

  return (
    <div className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm text-neutral-200">{deliverable.title}</p>
        {!deliverable.is_required && (
          <p className="text-xs text-neutral-600">Optional</p>
        )}
      </div>
      <div className="ml-3 flex shrink-0 items-center gap-2">
        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={['h-full rounded-full', allSubmitted ? 'bg-emerald-500' : 'bg-amber-500'].join(' ')}
            style={{ width: total > 0 ? `${(submitted / total) * 100}%` : '0%' }}
          />
        </div>
        <span
          className={[
            'tabular-nums text-xs',
            allSubmitted ? 'text-emerald-400' : noneSubmitted ? 'text-neutral-600' : 'text-amber-400',
          ].join(' ')}
        >
          {submitted}/{total}
        </span>
      </div>
    </div>
  );
}

function CurriculumRow({ file }: { file: CalendarCurriculumFile }) {
  return (
    <a
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-md border border-indigo-500/20 bg-indigo-500/5 px-4 py-2.5 transition-colors hover:border-indigo-500/40"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs font-medium text-indigo-400">
          {FILE_TYPE_LABELS[file.file_type]}
        </span>
        <span className="truncate text-sm text-neutral-200">{file.title}</span>
      </div>
      <span className="ml-3 shrink-0 text-xs text-neutral-500">↗</span>
    </a>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-neutral-500">{label}</span>
    </div>
  );
}
