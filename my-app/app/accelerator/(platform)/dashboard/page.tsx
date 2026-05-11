import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type {
  AccelProfile,
  AccelWeek,
  AccelTeam,
  AccelSubmission,
  AccelMilestoneFunding,
  AccelTractionEntry,
  AccelDailyReport,
  AccelProgramEvent,
  AccelMentorAssessment,
  AccelFundingStatus,
  AGGIEX_2026_PROGRAM_ID,
} from '@/lib/accel-types';
import { ACCEL_ROLES } from '@/lib/accel-types';
import AggiexTeamDashboard from './components/aggiex-team-dashboard';
import FounderDashboard from './components/founder-dashboard';
import MentorDashboard from './components/mentor-dashboard';
import MceStaffDashboard from './components/mce-staff-dashboard';

// Fetch profile and branch to role-specific dashboard data fetcher
async function fetchDashboardData(profile: AccelProfile) {
  const supabase = await createClient();

  if (profile.role === 'aggiex_team' || profile.role === 'mce_staff') {
    return fetchAdminDashboardData(supabase, profile);
  }

  if (profile.role === 'founder') {
    return fetchFounderDashboardData(supabase, profile);
  }

  if (profile.role === 'mentor') {
    return fetchMentorDashboardData(supabase, profile);
  }

  return null;
}

async function fetchAdminDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, profile: AccelProfile) {
  const [teamsResult, currentWeekResult, upcomingEventsResult, mentorsResult, allWeeksResult] = await Promise.all([
    supabase
      .from('accel_teams')
      .select(`
        *,
        accel_milestone_funding (*)
      `)
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
      .select(`
        id, full_name, email,
        accel_mentor_assignments (team_id, tier, accel_teams (name))
      `)
      .eq('role', 'mentor')
      .eq('is_active', true)
      .order('full_name'),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme, is_unlocked, start_date, end_date')
      .order('week_number'),
  ]);

  // For the current week, fetch submission status per team
  const currentWeek = currentWeekResult.data;
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

      const teams: AccelTeam[] = teamsResult.data ?? [];

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

async function fetchFounderDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, profile: AccelProfile) {
  if (!profile.team_id) return { role: profile.role, team: null };

  const [teamResult, currentWeekResult, upcomingEventsResult, recentMeetingsResult] = await Promise.all([
    supabase
      .from('accel_teams')
      .select('*')
      .eq('id', profile.team_id)
      .single(),

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
      .in('visible_to', ['all', 'founders'])
      .order('event_date')
      .limit(5),

    supabase
      .from('accel_meeting_records')
      .select('id, meeting_type, meeting_date, duration_minutes, attendees')
      .eq('team_id', profile.team_id)
      .order('meeting_date', { ascending: false })
      .limit(3),
  ]);

  const currentWeek = currentWeekResult.data;
  let deliverables: Array<{ id: string; title: string; submission: { status: string } | null }> = [];

  if (currentWeek) {
    const { data: weekDeliverables } = await supabase
      .from('accel_deliverables')
      .select(`
        id,
        title,
        sort_order,
        accel_submissions!inner (status)
      `)
      .eq('week_id', currentWeek.id)
      .order('sort_order');

    deliverables = (weekDeliverables ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      submission: d.accel_submissions?.[0] ?? null,
    }));
  }

  return {
    role: profile.role,
    team: teamResult.data,
    currentWeek,
    upcomingEvents: upcomingEventsResult.data ?? [],
    deliverables,
    recentMeetings: recentMeetingsResult.data ?? [],
  };
}

async function fetchMentorDashboardData(supabase: Awaited<ReturnType<typeof createClient>>, profile: AccelProfile) {
  const { data: assignments } = await supabase
    .from('accel_mentor_assignments')
    .select(`
      *,
      accel_teams (*)
    `)
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const dashboardData = await fetchDashboardData(profile as AccelProfile);

  if (profile.role === 'aggiex_team') {
    return <AggiexTeamDashboard data={dashboardData} />;
  }

  if (profile.role === 'mce_staff') {
    return <MceStaffDashboard data={dashboardData} />;
  }

  if (profile.role === 'founder') {
    return <FounderDashboard data={dashboardData} />;
  }

  if (profile.role === 'mentor') {
    return <MentorDashboard data={dashboardData} />;
  }

  redirect('/accelerator/access-denied');
}
