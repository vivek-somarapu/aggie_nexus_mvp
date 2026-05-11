import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type {
  AccelRole,
  AccelWeek,
  AccelDeliverable,
  AccelProgramEvent,
  AccelSubmissionStatus,
} from '@/lib/accel-types';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import AcceleratorCalendarView, {
  type CalendarWeek,
  type CalendarCurriculumFile,
} from './components/accelerator-calendar-view';

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchFounderCalendarData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [weeksResult, deliverableResult, submissionsResult, eventsResult, curriculumResult] =
    await Promise.all([
      supabase
        .from('accel_weeks')
        .select('id, week_number, theme, start_date, end_date, demo_day_date, is_crucible, is_unlocked')
        .eq('is_unlocked', true)
        .order('week_number'),

      supabase
        .from('accel_deliverables')
        .select('id, week_id, title, is_required, sort_order')
        .order('sort_order'),

      supabase
        .from('accel_submissions')
        .select('deliverable_id, status')
        .eq('team_id', teamId),

      supabase
        .from('accel_program_events')
        .select('*')
        .gte('event_date', todayStr)
        .in('visible_to', ['all', 'founders'])
        .order('event_date')
        .limit(15),

      supabase
        .from('accel_curriculum_files')
        .select('id, week_id, title, file_type, file_url, accel_weeks(week_number, start_date)')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .eq('is_active', true)
        .order('uploaded_at'),
    ]);

  const weeks: AccelWeek[] = (weeksResult.data ?? []) as AccelWeek[];
  const allDeliverables = deliverableResult.data ?? [];
  const submissions = submissionsResult.data ?? [];

  const submissionMap = new Map<string, AccelSubmissionStatus>();
  for (const submission of submissions) {
    submissionMap.set(submission.deliverable_id, submission.status as AccelSubmissionStatus);
  }

  const calendarWeeks: CalendarWeek[] = weeks.map((week) => ({
    id: week.id,
    week_number: week.week_number,
    theme: week.theme,
    start_date: week.start_date,
    end_date: week.end_date,
    demo_day_date: week.demo_day_date,
    is_crucible: week.is_crucible,
    is_unlocked: week.is_unlocked,
    deliverables: allDeliverables
      .filter((d) => d.week_id === week.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        is_required: d.is_required,
        submissionStatus: submissionMap.get(d.id) ?? null,
      })),
  }));

  const curriculumFiles: CalendarCurriculumFile[] = (curriculumResult.data ?? []).map(
    (file: any) => ({
      id: file.id,
      title: file.title,
      file_type: file.file_type,
      file_url: file.file_url,
      week_start_date: file.accel_weeks?.start_date ?? null,
      week_number: file.accel_weeks?.week_number ?? null,
    })
  );

  return {
    role: 'founder' as AccelRole,
    weeks: calendarWeeks,
    programEvents: (eventsResult.data ?? []) as AccelProgramEvent[],
    curriculumFiles,
    todayStr,
  };
}

async function fetchAdminCalendarData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: AccelRole,
) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [weeksResult, deliverableResult, submissionsResult, teamsResult, eventsResult, curriculumResult] =
    await Promise.all([
      supabase
        .from('accel_weeks')
        .select('id, week_number, theme, start_date, end_date, demo_day_date, is_crucible, is_unlocked')
        .order('week_number'),

      supabase
        .from('accel_deliverables')
        .select('id, week_id, title, is_required, sort_order')
        .order('sort_order'),

      supabase
        .from('accel_submissions')
        .select('deliverable_id, team_id, status'),

      supabase
        .from('accel_teams')
        .select('id')
        .eq('is_active', true),

      supabase
        .from('accel_program_events')
        .select('*')
        .gte('event_date', todayStr)
        .order('event_date')
        .limit(15),

      supabase
        .from('accel_curriculum_files')
        .select('id, week_id, title, file_type, file_url, accel_weeks(week_number, start_date)')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .order('uploaded_at'),
    ]);

  const weeks: AccelWeek[] = (weeksResult.data ?? []) as AccelWeek[];
  const allDeliverables = deliverableResult.data ?? [];
  const submissions = submissionsResult.data ?? [];
  const totalTeamCount = (teamsResult.data ?? []).length;

  const submittedTeamsPerDeliverable = new Map<string, Set<string>>();
  for (const submission of submissions) {
    if (['submitted', 'under_review', 'approved'].includes(submission.status)) {
      const existing = submittedTeamsPerDeliverable.get(submission.deliverable_id) ?? new Set();
      existing.add(submission.team_id);
      submittedTeamsPerDeliverable.set(submission.deliverable_id, existing);
    }
  }

  const calendarWeeks: CalendarWeek[] = weeks.map((week) => ({
    id: week.id,
    week_number: week.week_number,
    theme: week.theme,
    start_date: week.start_date,
    end_date: week.end_date,
    demo_day_date: week.demo_day_date,
    is_crucible: week.is_crucible,
    is_unlocked: week.is_unlocked,
    deliverables: allDeliverables
      .filter((d) => d.week_id === week.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        is_required: d.is_required,
        submissionStatus: null,
        submittedTeamCount: submittedTeamsPerDeliverable.get(d.id)?.size ?? 0,
        totalTeamCount,
      })),
  }));

  const curriculumFiles: CalendarCurriculumFile[] = (curriculumResult.data ?? []).map(
    (file: any) => ({
      id: file.id,
      title: file.title,
      file_type: file.file_type,
      file_url: file.file_url,
      week_start_date: file.accel_weeks?.start_date ?? null,
      week_number: file.accel_weeks?.week_number ?? null,
    })
  );

  return {
    role,
    weeks: calendarWeeks,
    programEvents: (eventsResult.data ?? []) as AccelProgramEvent[],
    curriculumFiles,
    todayStr,
  };
}

async function fetchMentorCalendarData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: assignments } = await supabase
    .from('accel_mentor_assignments')
    .select('team_id')
    .eq('mentor_id', userId);

  const assignedTeamIds = (assignments ?? []).map((a) => a.team_id);
  const totalTeamCount = assignedTeamIds.length;

  const [weeksResult, deliverableResult, submissionsResult, eventsResult, curriculumResult] =
    await Promise.all([
      supabase
        .from('accel_weeks')
        .select('id, week_number, theme, start_date, end_date, demo_day_date, is_crucible, is_unlocked')
        .eq('is_unlocked', true)
        .order('week_number'),

      supabase
        .from('accel_deliverables')
        .select('id, week_id, title, is_required, sort_order')
        .order('sort_order'),

      assignedTeamIds.length > 0
        ? supabase
            .from('accel_submissions')
            .select('deliverable_id, team_id, status')
            .in('team_id', assignedTeamIds)
        : Promise.resolve({ data: [] }),

      supabase
        .from('accel_program_events')
        .select('*')
        .gte('event_date', todayStr)
        .in('visible_to', ['all', 'mentors'])
        .order('event_date')
        .limit(15),

      supabase
        .from('accel_curriculum_files')
        .select('id, week_id, title, file_type, file_url, accel_weeks(week_number, start_date)')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .eq('is_active', true)
        .order('uploaded_at'),
    ]);

  const weeks: AccelWeek[] = (weeksResult.data ?? []) as AccelWeek[];
  const allDeliverables = deliverableResult.data ?? [];
  const submissions = (submissionsResult.data ?? []) as Array<{
    deliverable_id: string;
    team_id: string;
    status: string;
  }>;

  const submittedTeamsPerDeliverable = new Map<string, Set<string>>();
  for (const submission of submissions) {
    if (['submitted', 'under_review', 'approved'].includes(submission.status)) {
      const existing = submittedTeamsPerDeliverable.get(submission.deliverable_id) ?? new Set();
      existing.add(submission.team_id);
      submittedTeamsPerDeliverable.set(submission.deliverable_id, existing);
    }
  }

  const calendarWeeks: CalendarWeek[] = weeks.map((week) => ({
    id: week.id,
    week_number: week.week_number,
    theme: week.theme,
    start_date: week.start_date,
    end_date: week.end_date,
    demo_day_date: week.demo_day_date,
    is_crucible: week.is_crucible,
    is_unlocked: week.is_unlocked,
    deliverables: allDeliverables
      .filter((d) => d.week_id === week.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        is_required: d.is_required,
        submissionStatus: null,
        submittedTeamCount: submittedTeamsPerDeliverable.get(d.id)?.size ?? 0,
        totalTeamCount,
      })),
  }));

  const curriculumFiles: CalendarCurriculumFile[] = (curriculumResult.data ?? []).map(
    (file: any) => ({
      id: file.id,
      title: file.title,
      file_type: file.file_type,
      file_url: file.file_url,
      week_start_date: file.accel_weeks?.start_date ?? null,
      week_number: file.accel_weeks?.week_number ?? null,
    })
  );

  return {
    role: 'mentor' as AccelRole,
    weeks: calendarWeeks,
    programEvents: (eventsResult.data ?? []) as AccelProgramEvent[],
    curriculumFiles,
    todayStr,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const role = profile.role as AccelRole;

  let calendarData: {
    role: AccelRole;
    weeks: CalendarWeek[];
    programEvents: AccelProgramEvent[];
    curriculumFiles: CalendarCurriculumFile[];
    todayStr: string;
  };

  if (role === 'founder') {
    if (!profile.team_id) redirect('/accelerator/dashboard');
    calendarData = await fetchFounderCalendarData(supabase, profile.team_id);
  } else if (role === 'mentor') {
    calendarData = await fetchMentorCalendarData(supabase, user.id);
  } else {
    calendarData = await fetchAdminCalendarData(supabase, role);
  }

  const { weeks, programEvents, curriculumFiles, todayStr } = calendarData;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">Program</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Calendar</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {role === 'founder'
            ? 'Deliverable due dates, curriculum resources, and program events.'
            : 'Submission progress per team, curriculum, and program events.'}
        </p>
      </div>

      <AcceleratorCalendarView
        role={role}
        weeks={weeks}
        programEvents={programEvents}
        curriculumFiles={curriculumFiles}
        todayStr={todayStr}
      />
    </div>
  );
}
