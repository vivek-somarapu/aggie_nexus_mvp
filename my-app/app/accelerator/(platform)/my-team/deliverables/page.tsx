import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SubmitDeliverablePanel from './components/submit-deliverable-panel';

async function fetchDeliverablesData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'founder' || !profile.team_id) {
    redirect('/accelerator/dashboard');
  }

  // All unlocked weeks
  const { data: weeks } = await supabase
    .from('accel_weeks')
    .select('id, week_number, theme, start_date')
    .eq('is_unlocked', true)
    .order('week_number', { ascending: false });

  if (!weeks || weeks.length === 0) {
    return { weeks: [], profile };
  }

  const weekIds = weeks.map((w) => w.id);

  const { data: deliverableRows } = await supabase
    .from('accel_deliverables')
    .select('id, week_id, title, description, is_required, expected_format, sort_order')
    .in('week_id', weekIds)
    .order('sort_order');

  const deliverableIds = (deliverableRows ?? []).map((d) => d.id);

  // Fetch submissions and team-visible reviews in parallel
  const [submissionsResult, reviewsResult] = await Promise.all([
    deliverableIds.length > 0
      ? supabase
          .from('accel_submissions')
          .select('id, deliverable_id, status, submitted_at, text_content, version')
          .eq('team_id', profile.team_id)
          .in('deliverable_id', deliverableIds)
          .order('version', { ascending: false })
      : Promise.resolve({ data: [] }),

    // Team-visible review feedback only
    deliverableIds.length > 0
      ? supabase
          .from('accel_reviews')
          .select('id, submission_id, comments')
          .eq('visibility', 'team')
          .not('comments', 'is', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  // Latest submission per deliverable
  const latestByDeliverable = new Map<
    string,
    NonNullable<typeof submissionsResult.data>[number]
  >();
  for (const submission of submissionsResult.data ?? []) {
    if (!latestByDeliverable.has(submission.deliverable_id)) {
      latestByDeliverable.set(submission.deliverable_id, submission);
    }
  }

  // Latest team-visible review per submission
  const reviewBySubmission = new Map<string, string>();
  for (const review of reviewsResult.data ?? []) {
    if (!reviewBySubmission.has(review.submission_id) && review.comments) {
      reviewBySubmission.set(review.submission_id, review.comments);
    }
  }

  const weeksWithDeliverables = weeks.map((week) => ({
    ...week,
    deliverables: (deliverableRows ?? [])
      .filter((d) => d.week_id === week.id)
      .map((d) => {
        const submission = latestByDeliverable.get(d.id) ?? null;
        const feedback = submission
          ? (reviewBySubmission.get(submission.id) ?? null)
          : null;
        return { ...d, submission, feedback };
      }),
  }));

  return { weeks: weeksWithDeliverables, profile };
}

export default async function DeliverablesPage() {
  const { weeks, profile } = await fetchDeliverablesData();

  const totalDeliverables = weeks.reduce((sum, w) => sum + w.deliverables.length, 0);
  const submittedTotal = weeks.reduce(
    (sum, w) =>
      sum +
      w.deliverables.filter(
        (d) =>
          d.submission?.status &&
          ['submitted', 'under_review', 'approved'].includes(d.submission.status)
      ).length,
    0
  );
  const needsRevisionTotal = weeks.reduce(
    (sum, w) =>
      sum +
      w.deliverables.filter(
        (d) =>
          d.submission?.status === 'needs_revision' ||
          d.submission?.status === 'flagged'
      ).length,
    0
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">My Team</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Deliverables</h1>
          {totalDeliverables > 0 && (
            <p className="mt-0.5 text-sm text-neutral-500">
              {submittedTotal}/{totalDeliverables} submitted
              {needsRevisionTotal > 0 && (
                <span className="ml-2 text-orange-400">
                  · {needsRevisionTotal} need{needsRevisionTotal > 1 ? '' : 's'} revision
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {weeks.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">
            No weeks unlocked yet. Check back once the program starts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {weeks.map((week) => {
            const weekSubmitted = week.deliverables.filter((d) =>
              d.submission?.status &&
              ['submitted', 'under_review', 'approved'].includes(d.submission.status)
            ).length;

            const weekNeedsRevision = week.deliverables.filter(
              (d) =>
                d.submission?.status === 'needs_revision' ||
                d.submission?.status === 'flagged'
            ).length;

            return (
              <section key={week.id}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="text-sm font-medium text-neutral-200">
                    Week {week.week_number} — {week.theme}
                  </h2>
                  <div className="flex items-center gap-3">
                    {weekNeedsRevision > 0 && (
                      <span className="text-xs text-orange-400">
                        {weekNeedsRevision} revision{weekNeedsRevision > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-neutral-600">
                      {weekSubmitted}/{week.deliverables.length} submitted
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {week.deliverables.map((deliverable) => (
                    <SubmitDeliverablePanel
                      key={deliverable.id}
                      deliverable={deliverable}
                      teamId={profile.team_id!}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
