import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DailyReportForm from './components/daily-report-form';

async function fetchDailyReportData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'founder' || !profile.team_id) {
    redirect('/accelerator/dashboard');
  }

  // Last 7 submitted reports for this team
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentReports } = await supabase
    .from('accel_daily_reports')
    .select('id, report_date, win, blocker, submitted_at')
    .eq('team_id', profile.team_id)
    .gte('report_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('report_date', { ascending: false });

  // Check if today's report is already submitted
  const today = new Date().toISOString().split('T')[0];
  const todayReport = (recentReports ?? []).find((r) => r.report_date === today);

  return {
    teamId: profile.team_id,
    recentReports: recentReports ?? [],
    todayReport: todayReport ?? null,
    today,
  };
}

export default async function DailyReportPage() {
  const { teamId, recentReports, todayReport, today } = await fetchDailyReportData();

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Daily Report</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <DailyReportForm
        teamId={teamId}
        today={today}
        existingReport={todayReport}
      />

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
            Last 7 Days
          </h2>
          <div className="flex flex-col gap-3">
            {recentReports.map((report) => {
              const reportDate = new Date(report.report_date + 'T00:00:00');
              const isToday = report.report_date === today;

              return (
                <div
                  key={report.id}
                  className="rounded-lg border border-neutral-800 px-4 py-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">
                      {isToday
                        ? 'Today'
                        : reportDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-widest text-emerald-600">
                        Win
                      </p>
                      <p className="text-sm text-neutral-200">{report.win}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-widest text-amber-600">
                        Blocker
                      </p>
                      <p className="text-sm text-neutral-200">{report.blocker}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
