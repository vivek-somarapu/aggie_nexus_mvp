import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  SUBMISSION_STATUS_LABELS,
  FUNDING_STATUS_LABELS,
  MENTOR_TIER_LABELS,
  CRUCIBLE_OUTCOME_LABELS,
} from '@/lib/accel-types';
import type { AccelRole, AccelSubmissionStatus, AccelFundingStatus } from '@/lib/accel-types';
import FundingEditor from './components/funding-editor';
import LogoEditor from './components/logo-editor';
import ReviewSubmissionsPanel from './components/review-submissions-panel';

// ─── Types ───────────────────────────────────────────────────

interface WeekProgress {
  id: string;
  week_number: number;
  theme: string;
  is_unlocked: boolean;
  submitted: number;
  total: number;
}

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'text-neutral-600',
  in_progress: 'text-blue-400',
  submitted: 'text-amber-400',
  under_review: 'text-purple-400',
  approved: 'text-emerald-400',
  needs_revision: 'text-orange-400',
  flagged: 'text-red-400',
};

// ─── Data fetcher ─────────────────────────────────────────────

async function fetchTeamDetailData(teamId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const [teamResult, weeksResult] = await Promise.all([
    supabase
      .from('accel_teams')
      .select(`
        *,
        accel_founders (*),
        accel_milestone_funding (*),
        accel_mentor_assignments (
          id, tier, assigned_weeks, commitment_signed,
          accel_profiles!accel_mentor_assignments_mentor_id_fkey (id, full_name, email)
        )
      `)
      .eq('id', teamId)
      .single(),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme, is_unlocked')
      .order('week_number'),
  ]);

  if (!teamResult.data) notFound();

  const team = teamResult.data;
  const weeks = weeksResult.data ?? [];

  // Fetch all deliverables and submissions for this team across all weeks
  const { data: deliverables } = await supabase
    .from('accel_deliverables')
    .select('id, week_id');

  const { data: submissions } = await supabase
    .from('accel_submissions')
    .select('deliverable_id, status')
    .eq('team_id', teamId)
    .in('status', ['submitted', 'under_review', 'approved']);

  const submittedDeliverableIds = new Set(
    (submissions ?? []).map((s) => s.deliverable_id)
  );

  // Build per-week progress
  const weekProgress: WeekProgress[] = weeks.map((week) => {
    const weekDeliverables = (deliverables ?? []).filter((d) => d.week_id === week.id);
    const submitted = weekDeliverables.filter((d) =>
      submittedDeliverableIds.has(d.id)
    ).length;
    return {
      id: week.id,
      week_number: week.week_number,
      theme: week.theme,
      is_unlocked: week.is_unlocked,
      submitted,
      total: weekDeliverables.length,
    };
  });

  // Current week = highest unlocked
  const currentWeek = weeks.filter((w) => w.is_unlocked).at(-1) ?? null;

  // For admins: fetch full submission detail + existing team-visible reviews
  let reviewableSubmissions: Array<{
    id: string;
    deliverableId: string;
    deliverableTitle: string;
    status: AccelSubmissionStatus;
    textContent: string | null;
    submittedAt: string | null;
    version: number;
    existingFeedback: string | null;
  }> = [];

  let currentWeekDeliverables: Array<{
    id: string;
    title: string;
    sort_order: number;
    submission: { status: AccelSubmissionStatus } | null;
  }> = [];

  if (currentWeek) {
    const { data: wDeliverables } = await supabase
      .from('accel_deliverables')
      .select('id, title, sort_order')
      .eq('week_id', currentWeek.id)
      .order('sort_order');

    if (wDeliverables) {
      const deliverableIds = wDeliverables.map((d) => d.id);

      const [submissionsResult, reviewsResult] = await Promise.all([
        supabase
          .from('accel_submissions')
          .select('id, deliverable_id, status, text_content, submitted_at, version')
          .eq('team_id', teamId)
          .in('deliverable_id', deliverableIds)
          .order('version', { ascending: false }),

        supabase
          .from('accel_reviews')
          .select('submission_id, comments')
          .eq('visibility', 'team')
          .not('comments', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      // Latest submission per deliverable
      const latestByDeliverable = new Map<string, NonNullable<typeof submissionsResult.data>[number]>();
      for (const submission of submissionsResult.data ?? []) {
        if (!latestByDeliverable.has(submission.deliverable_id)) {
          latestByDeliverable.set(submission.deliverable_id, submission);
        }
      }

      // Latest feedback per submission
      const feedbackBySubmission = new Map<string, string>();
      for (const review of reviewsResult.data ?? []) {
        if (!feedbackBySubmission.has(review.submission_id) && review.comments) {
          feedbackBySubmission.set(review.submission_id, review.comments);
        }
      }

      currentWeekDeliverables = wDeliverables.map((d) => {
        const sub = latestByDeliverable.get(d.id) ?? null;
        return { ...d, submission: sub ? { status: sub.status as AccelSubmissionStatus } : null };
      });

      reviewableSubmissions = wDeliverables.map((d) => {
        const sub = latestByDeliverable.get(d.id) ?? null;
        return {
          id: sub?.id ?? '',
          deliverableId: d.id,
          deliverableTitle: d.title,
          status: (sub?.status ?? 'not_started') as AccelSubmissionStatus,
          textContent: sub?.text_content ?? null,
          submittedAt: sub?.submitted_at ?? null,
          version: sub?.version ?? 1,
          existingFeedback: sub ? (feedbackBySubmission.get(sub.id) ?? null) : null,
        };
      });
    }
  }

  return {
    team,
    role: profile.role as AccelRole,
    currentWeek,
    currentWeekDeliverables,
    reviewableSubmissions,
    weekProgress,
  };
}

// ─── Page ─────────────────────────────────────────────────────

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { team, role, currentWeek, currentWeekDeliverables, reviewableSubmissions, weekProgress } =
    await fetchTeamDetailData(id);

  const funding = team.accel_milestone_funding?.[0] ?? null;
  const isAdmin = role === 'aggiex_team';

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
            {team.logo_url ? (
              <Image
                src={team.logo_url}
                alt={`${team.name} logo`}
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-xl font-bold text-neutral-600">
                {team.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <Link
              href="/accelerator/teams"
              className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              ← Teams
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-100">{team.name}</h1>
            <div className="mt-0.5 flex flex-wrap gap-3 text-sm text-neutral-500">
              {team.industry_vertical && <span>{team.industry_vertical}</span>}
              {team.venture_stage && <span>· {team.venture_stage}</span>}
              {team.entity_type !== 'none' && (
                <span className="uppercase">· {team.entity_type}</span>
              )}
            </div>
          </div>
        </div>

        {/* Funding summary (read) or editor (admin) */}
        {isAdmin ? (
          <FundingEditor teamId={team.id} funding={funding} />
        ) : (
          funding && (
            <div className="text-right">
              <p className={`text-sm font-medium ${
                funding.funding_status === 'on_track' ? 'text-emerald-400' :
                funding.funding_status === 'probation' ? 'text-red-400' :
                funding.funding_status === 'paused' ? 'text-amber-400' : 'text-neutral-500'
              }`}>
                {FUNDING_STATUS_LABELS[funding.funding_status as AccelFundingStatus]}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                ${Number(funding.amount_unlocked).toLocaleString()} / ${Number(funding.total_award).toLocaleString()}
              </p>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — deliverables + progress */}
        <div className="col-span-2 flex flex-col gap-6">
          {/* Current week deliverables — with inline review for admins */}
          {currentWeek && currentWeekDeliverables.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                Week {currentWeek.week_number} Deliverables
              </h2>

              {isAdmin ? (
                <ReviewSubmissionsPanel submissions={reviewableSubmissions} />
              ) : (
                <div className="overflow-hidden rounded-lg border border-neutral-800">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-800/50">
                      {currentWeekDeliverables.map((d) => {
                        const status: AccelSubmissionStatus =
                          d.submission?.status ?? 'not_started';
                        return (
                          <tr key={d.id} className="hover:bg-neutral-900/30">
                            <td className="px-4 py-3 text-neutral-200">{d.title}</td>
                            <td
                              className={`px-4 py-3 text-right text-xs font-medium ${STATUS_COLORS[status]}`}
                            >
                              {SUBMISSION_STATUS_LABELS[status]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* All-weeks progress */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Program Progress
            </h2>
            <div className="flex flex-col gap-1.5">
              {weekProgress.map((week) => {
                const pct = week.total > 0 ? (week.submitted / week.total) * 100 : 0;
                const isComplete = week.total > 0 && week.submitted >= week.total;

                return (
                  <div
                    key={week.id}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${
                      !week.is_unlocked
                        ? 'border-neutral-800/40 opacity-40'
                        : 'border-neutral-800'
                    }`}
                  >
                    <span className="w-14 shrink-0 text-xs font-medium text-neutral-400">
                      Wk {week.week_number}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
                      {week.theme}
                    </span>
                    {week.is_unlocked && week.total > 0 ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
                          <div
                            className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`w-8 text-right text-xs tabular-nums ${isComplete ? 'text-emerald-400' : 'text-neutral-400'}`}>
                          {week.submitted}/{week.total}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-700">
                        {week.is_unlocked ? '—' : 'Locked'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Crucible outcome */}
          {team.crucible_outcome && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                Crucible Outcome
              </h2>
              <div className="rounded-lg border border-neutral-800 px-4 py-4">
                <span className={`inline-block rounded px-2 py-1 text-sm font-medium capitalize ${
                  team.crucible_outcome === 'accelerate' ? 'bg-emerald-500/10 text-emerald-400' :
                  team.crucible_outcome === 'refine' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {CRUCIBLE_OUTCOME_LABELS[team.crucible_outcome]}
                </span>
                {team.crucible_reviewed_at && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Reviewed {new Date(team.crucible_reviewed_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Logo upload (admin only) */}
          {isAdmin && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                Logo
              </h2>
              <LogoEditor teamId={team.id} currentLogoUrl={team.logo_url ?? null} />
            </section>
          )}

          {/* Founders */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Founders
            </h2>
            {team.accel_founders?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {team.accel_founders.map((founder: { id: string; full_name: string; role_title?: string; equity_pct?: number }) => (
                  <div key={founder.id} className="rounded-md border border-neutral-800 px-3 py-2.5">
                    <p className="text-sm font-medium text-neutral-100">{founder.full_name}</p>
                    {founder.role_title && (
                      <p className="text-xs text-neutral-500">{founder.role_title}</p>
                    )}
                    {founder.equity_pct != null && (
                      <p className="text-xs text-neutral-600">{founder.equity_pct}% equity</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-600">No founders recorded.</p>
            )}
          </section>

          {/* Mentors */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Mentors
            </h2>
            {team.accel_mentor_assignments?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {team.accel_mentor_assignments.map((assignment: { id: string; tier: string; assigned_weeks?: number[]; commitment_signed: boolean; accel_profiles?: { full_name: string } }) => (
                  <div key={assignment.id} className="rounded-md border border-neutral-800 px-3 py-2.5">
                    <p className="text-sm font-medium text-neutral-100">
                      {assignment.accel_profiles?.full_name}
                    </p>
                    <p className="text-xs capitalize text-neutral-500">
                      {MENTOR_TIER_LABELS[assignment.tier as keyof typeof MENTOR_TIER_LABELS]}
                      {assignment.assigned_weeks
                        ? ` · Wks ${assignment.assigned_weeks.join(', ')}`
                        : ' · Full program'}
                    </p>
                    {!assignment.commitment_signed && (
                      <p className="mt-0.5 text-xs text-amber-500">Commitment unsigned</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-600">No mentors assigned.</p>
            )}
          </section>

          {/* Links */}
          {(team.website || team.pitch_deck_url) && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                Links
              </h2>
              <div className="flex flex-col gap-1.5">
                {team.website && (
                  <a href={team.website} target="_blank" rel="noreferrer"
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-200">
                    Website ↗
                  </a>
                )}
                {team.pitch_deck_url && (
                  <a href={team.pitch_deck_url} target="_blank" rel="noreferrer"
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-200">
                    Pitch deck ↗
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
