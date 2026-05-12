import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import type { AccelMeetingType, AccelRole } from '@/lib/accel-types';

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

const ALLOWED_ROLES: AccelRole[] = ['aggiex_team', 'mce_staff', 'mentor'];

async function fetchMeetingsData(role: AccelRole, userId: string) {
  const supabase = await createClient();

  if (role === 'mentor') {
    // Mentors see meetings for their assigned teams only
    const { data: assignments } = await supabase
      .from('accel_mentor_assignments')
      .select('team_id')
      .eq('mentor_id', userId);

    const assignedTeamIds = assignments?.map((a) => a.team_id) ?? [];

    if (assignedTeamIds.length === 0) return { meetings: [], teams: [] };

    const [meetingsResult, teamsResult] = await Promise.all([
      supabase
        .from('accel_meeting_records')
        .select(`
          id, team_id, meeting_type, meeting_date,
          duration_minutes, attendees, notes, action_items,
          accel_weeks(week_number),
          accel_teams(name)
        `)
        .in('team_id', assignedTeamIds)
        .order('meeting_date', { ascending: false })
        .limit(50),

      supabase
        .from('accel_teams')
        .select('id, name')
        .in('id', assignedTeamIds)
        .order('name'),
    ]);

    return { meetings: meetingsResult.data ?? [], teams: teamsResult.data ?? [] };
  }

  // aggiex_team and mce_staff see all meetings
  const [meetingsResult, teamsResult] = await Promise.all([
    supabase
      .from('accel_meeting_records')
      .select(`
        id, team_id, meeting_type, meeting_date,
        duration_minutes, attendees, notes, action_items,
        accel_weeks(week_number),
        accel_teams(name)
      `)
      .order('meeting_date', { ascending: false })
      .limit(100),

    supabase
      .from('accel_teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ]);

  return { meetings: meetingsResult.data ?? [], teams: teamsResult.data ?? [] };
}

export default async function MeetingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role as AccelRole)) {
    redirect('/accelerator/dashboard');
  }

  const { meetings, teams } = await fetchMeetingsData(profile.role as AccelRole, user.id);

  // Group meetings by team for the summary strip
  const meetingCountByTeam = new Map<string, number>();
  for (const meeting of meetings) {
    const count = meetingCountByTeam.get(meeting.team_id) ?? 0;
    meetingCountByTeam.set(meeting.team_id, count + 1);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          {profile.role === 'mentor' ? 'Mentor' : 'AggieX'}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Meetings</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} logged
          {profile.role !== 'mentor' && ` across ${teams.length} team${teams.length !== 1 ? 's' : ''}`}.
        </p>
      </div>

      {/* Team meeting count strip — admin/staff only */}
      {(profile.role === 'aggiex_team' || profile.role === 'mce_staff') && teams.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-neutral-800 px-3 py-3">
              <p className="text-xs text-neutral-500 truncate">{team.name}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-100">
                {meetingCountByTeam.get(team.id) ?? 0}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Meeting list */}
      {meetings.length === 0 ? (
        <p className="rounded-lg border border-neutral-800 px-4 py-12 text-center text-sm text-neutral-500">
          No meetings logged yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((meeting) => {
            const weekNumber = (meeting.accel_weeks as { week_number: number } | null)?.week_number;
            const teamName = (meeting.accel_teams as { name: string } | null)?.name;

            return (
              <div
                key={meeting.id}
                className="rounded-lg border border-neutral-800 px-4 py-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-200">
                        {MEETING_TYPE_LABELS[meeting.meeting_type as AccelMeetingType]}
                      </span>
                      {weekNumber && (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                          Wk {weekNumber}
                        </span>
                      )}
                    </div>
                    {teamName && (
                      <p className="mt-0.5 text-xs text-neutral-500">{teamName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-500">
                      {format(parseISO(meeting.meeting_date), 'EEE, MMM d, yyyy')}
                    </p>
                    {meeting.duration_minutes && (
                      <p className="text-xs text-neutral-600">{meeting.duration_minutes}m</p>
                    )}
                  </div>
                </div>

                {meeting.attendees && meeting.attendees.length > 0 && (
                  <p className="mb-1.5 text-xs text-neutral-500">
                    {meeting.attendees.join(', ')}
                  </p>
                )}

                {meeting.notes && (
                  <p className="text-sm text-neutral-400">{meeting.notes}</p>
                )}

                {meeting.action_items && meeting.action_items.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {meeting.action_items.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-1.5 text-xs text-neutral-500">
                        <span className="mt-0.5 shrink-0 text-neutral-700">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
