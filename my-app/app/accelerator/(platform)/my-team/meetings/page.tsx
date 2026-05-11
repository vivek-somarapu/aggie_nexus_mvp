import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogMeetingForm from './components/log-meeting-form';
import type { AccelMeetingType } from '@/lib/accel-types';

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

async function fetchMeetingsPageData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile?.team_id) redirect('/accelerator/dashboard');
  if (profile.role !== 'founder') redirect('/accelerator/dashboard');

  const [meetingsResult, weeksResult] = await Promise.all([
    supabase
      .from('accel_meeting_records')
      .select('id, meeting_type, meeting_date, duration_minutes, attendees, notes, action_items, accel_weeks(week_number)')
      .eq('team_id', profile.team_id)
      .order('meeting_date', { ascending: false })
      .limit(20),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme')
      .eq('is_unlocked', true)
      .order('week_number'),
  ]);

  return {
    teamId: profile.team_id,
    meetings: meetingsResult.data ?? [],
    unlockedWeeks: weeksResult.data ?? [],
    today: new Date().toISOString().split('T')[0],
  };
}

export default async function MyTeamMeetingsPage() {
  const { teamId, meetings, unlockedWeeks, today } = await fetchMeetingsPageData();

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Meetings</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Log mentor sessions, 1-on-1s, and other meetings.
        </p>
      </div>

      <LogMeetingForm
        teamId={teamId}
        unlockedWeeks={unlockedWeeks}
        today={today}
      />

      {/* Meeting history */}
      {meetings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Recent Meetings
          </h2>
          <div className="flex flex-col gap-3">
            {meetings.map((meeting) => {
              const meetingDate = new Date(meeting.meeting_date + 'T00:00:00');
              const weekNumber = (meeting.accel_weeks as { week_number: number } | null)?.week_number;

              return (
                <div
                  key={meeting.id}
                  className="rounded-lg border border-neutral-800 px-4 py-4"
                >
                  <div className="mb-2 flex items-center justify-between">
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
                    <div className="flex items-center gap-2">
                      {meeting.duration_minutes && (
                        <span className="text-xs text-neutral-600">
                          {meeting.duration_minutes}m
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">
                        {meetingDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {meeting.attendees && meeting.attendees.length > 0 && (
                    <p className="mb-1.5 text-xs text-neutral-500">
                      {meeting.attendees.join(', ')}
                    </p>
                  )}

                  {meeting.notes && (
                    <p className="mb-1.5 text-sm text-neutral-400">{meeting.notes}</p>
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
        </section>
      )}
    </div>
  );
}
