import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AccelProfile, AccelProgramEvent } from '@/lib/accel-types';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import AggiexTeamDashboard from './components/aggiex-team-dashboard';
import FounderDashboard from './components/founder-dashboard';
import MentorDashboard from './components/mentor-dashboard';
import MceStaffDashboard from './components/mce-staff-dashboard';

// ─── Admin / MCE staff fetcher ────────────────────────────────────────────────

async function fetchAdminDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AccelProfile
) {
  const [teamsResult, currentWeekResult, upcomingEventsResult, mentorsResult, allWeeksResult] =
    await Promise.all([
      supabase
        .from('accel_teams')
        .select('*, accel_milestone_funding (*)')
        .eq('is_active', true)
        .order('name'),

      supabase
        .from('accel_weeks')
        .select('*')
        .lte('start_date', new Date().toISOString().split('T')[0])
        .order('week_number', { ascending: false })
        .limit(1)
        .single(),

      supabase
        .from('accel_program_events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date')
        .limit(5),

      supabase
        .from('accel_profiles')
        .select('id, full_name, email, accel_mentor_assignments (team_id, tier, accel_teams (name))')
        .eq('role', 'mentor')
        .eq('is_active', true)
        .order('full_name'),

      supabase
        .from('accel_weeks')
        .select('id, week_number, theme, is_unlocked, start_date, end_date')
        .order('week_number'),
    ]);

  const currentWeek = currentWeekResult.data;

  // Submission summary per team for the current week
  let submissionSummary: Array<{
    team_id: string;
    submitted_count: number;
    total_count: number;
    has_flagged: boolean;
  }> = [];

  if (currentWeek) {
    const { data: deliverables } = await supabase
      .from('accel_deliverables')
      .select('id')
      .eq('week_id', currentWeek.id);

    const deliverableIds = deliverables?.map((d) => d.id) ?? [];

    if (deliverableIds.length > 0) {
      const { data: submissions } = await supabase
        .from('accel_submissions')
        .select('team_id, status, deliverable_id')
        .in('deliverable_id', deliverableIds);

      const teams = teamsResult.data ?? [];
      submissionSummary = teams.map((team) => {
        const teamSubmissions = submissions?.filter((s) => s.team_id === team.id) ?? [];
        return {
          team_id: team.id,
          submitted_count: teamSubmissions.filter((s) =>
            ['submitted', 'under_review', 'approved'].includes(s.status)
          ).length,
          total_count: deliverableIds.length,
          has_flagged: teamSubmissions.some((s) => s.status === 'flagged'),
        };
      });
    }
  }

  const allWeeks = allWeeksResult.data ?? [];
  const nextLockedWeek = allWeeks.find((w) => !w.is_unlocked) ?? null;

  return {
    role: profile.role,
    teams: teamsResult.data ?? [],
    currentWeek,
    upcomingEvents: upcomingEventsResult.data ?? [],
    submissionSummary,
    mentors: mentorsResult.data ?? [],
    nextLockedWeek,
  };
}

// ─── Founder fetcher ──────────────────────────────────────────────────────────

async function fetchFounderDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AccelProfile
) {
  if (!profile.team_id) {
    return { role: profile.role, team: null };
  }

  const [
    teamResult,
    currentWeekResult,
    upcomingEventsResult,
    recentMeetingsResult,
    mentorAssignmentsResult,
    tractionCountResult,
  ] = await Promise.all([
    supabase.from('accel_teams').select('id, name').eq('id', profile.team_id).single(),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme')
      .eq('is_unlocked', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('accel_program_events')
      .select('id, title, event_date, is_mandatory, event_type')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .in('visible_to', ['all', 'founders'])
      .order('event_date')
      .limit(5),

    supabase
      .from('accel_meeting_records')
      .select('id, meeting_type, meeting_date, duration_minutes')
      .eq('team_id', profile.team_id)
      .order('meeting_date', { ascending: false })
      .limit(3),

    // Mentor assignments for this team
    supabase
      .from('accel_mentor_assignments')
      .select('id, mentor_id, tier, assigned_weeks, accel_profiles!mentor_id (full_name, email)')
      .eq('team_id', profile.team_id),

    // How many traction entries logged this program
    supabase
      .from('accel_traction_entries')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', profile.team_id),
  ]);

  const currentWeek = currentWeekResult.data;

  // Fetch deliverables and submissions separately to avoid inner-join exclusion
  let deliverables: Array<{
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
  }> = [];

  let curriculumFiles: Array<{
    id: string;
    title: string;
    file_type: string;
    file_url: string;
  }> = [];

  if (currentWeek) {
    const [deliverableRows, curriculumResult] = await Promise.all([
      supabase
        .from('accel_deliverables')
        .select('id, title, description, is_required, expected_format, sort_order')
        .eq('week_id', currentWeek.id)
        .order('sort_order'),

      supabase
        .from('accel_curriculum_files')
        .select('id, title, file_type, file_url')
        .eq('week_id', currentWeek.id)
        .eq('is_active', true)
        .in('access_level', ['all', 'founders_only'])
        .order('title'),
    ]);

    const deliverableIds = (deliverableRows.data ?? []).map((d) => d.id);
    curriculumFiles = curriculumResult.data ?? [];

    // Fetch submissions and reviews in parallel
    const [submissionsResult, reviewsResult] = await Promise.all([
      deliverableIds.length > 0
        ? supabase
            .from('accel_submissions')
            .select('id, deliverable_id, status, text_content, version, submitted_at')
            .eq('team_id', profile.team_id)
            .in('deliverable_id', deliverableIds)
            .order('version', { ascending: false })
        : Promise.resolve({ data: [] }),

      // Fetch team-visible reviews for this team's submissions
      deliverableIds.length > 0
        ? supabase
            .from('accel_reviews')
            .select('id, submission_id, comments, score, created_at')
            .eq('visibility', 'team')
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    // Keep only the latest submission per deliverable
    const latestByDeliverable = new Map<string, NonNullable<typeof submissionsResult.data>[number]>();
    for (const submission of submissionsResult.data ?? []) {
      if (!latestByDeliverable.has(submission.deliverable_id)) {
        latestByDeliverable.set(submission.deliverable_id, submission);
      }
    }

    // Map reviews by submission id
    const reviewBySubmission = new Map<string, string | null>();
    for (const review of reviewsResult.data ?? []) {
      if (!reviewBySubmission.has(review.submission_id) && review.comments) {
        reviewBySubmission.set(review.submission_id, review.comments);
      }
    }

    deliverables = (deliverableRows.data ?? []).map((d) => {
      const submission = latestByDeliverable.get(d.id) ?? null;
      const feedback = submission ? (reviewBySubmission.get(submission.id) ?? null) : null;
      return {
        id: d.id,
        title: d.title,
        description: d.description,
        is_required: d.is_required,
        expected_format: d.expected_format,
        submission,
        feedback,
      };
    });
  }

  return {
    role: profile.role,
    team: teamResult.data,
    currentWeek,
    upcomingEvents: (upcomingEventsResult.data ?? []) as AccelProgramEvent[],
    deliverables,
    recentMeetings: recentMeetingsResult.data ?? [],
    mentorAssignments: mentorAssignmentsResult.data ?? [],
    tractionEntryCount: tractionCountResult.count ?? 0,
    curriculumFiles,
  };
}

// ─── Mentor fetcher ───────────────────────────────────────────────────────────

async function fetchMentorDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: AccelProfile
) {
  const { data: assignments } = await supabase
    .from('accel_mentor_assignments')
    .select('*, accel_teams (*)')
    .eq('mentor_id', profile.id);

  const assignedTeamIds = (assignments ?? []).map((a) => a.team_id);

  const [currentWeekResult, upcomingEventsResult, recentMeetingsResult] = await Promise.all([
    supabase
      .from('accel_weeks')
      .select('*')
      .eq('is_unlocked', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('accel_program_events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .in('visible_to', ['all', 'mentors'])
      .order('event_date')
      .limit(5),

    assignedTeamIds.length > 0
      ? supabase
          .from('accel_meeting_records')
          .select('id, team_id, meeting_type, meeting_date, accel_teams(name)')
          .in('team_id', assignedTeamIds)
          .order('meeting_date', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    role: profile.role,
    assignments: assignments ?? [],
    currentWeek: currentWeekResult.data,
    upcomingEvents: upcomingEventsResult.data ?? [],
    recentMeetings: recentMeetingsResult.data ?? [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const accelProfile = profile as AccelProfile;

  if (accelProfile.role === 'aggiex_team') {
    const data = await fetchAdminDashboardData(supabase, accelProfile);
    return <AggiexTeamDashboard data={data} />;
  }

  if (accelProfile.role === 'mce_staff') {
    const data = await fetchAdminDashboardData(supabase, accelProfile);
    return <MceStaffDashboard data={data} />;
  }

  if (accelProfile.role === 'founder') {
    const data = await fetchFounderDashboardData(supabase, accelProfile);
    return <FounderDashboard data={data} />;
  }

  if (accelProfile.role === 'mentor') {
    const data = await fetchMentorDashboardData(supabase, accelProfile);
    return <MentorDashboard data={data} />;
  }

  redirect('/accelerator/access-denied');
}
