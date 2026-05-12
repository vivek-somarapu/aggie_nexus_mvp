'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelSubmissionStatus } from '@/lib/accel-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const REVIEWABLE_STATUSES: AccelSubmissionStatus[] = [
  'under_review',
  'approved',
  'needs_revision',
  'flagged',
];

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'text-neutral-600',
  in_progress: 'text-blue-400',
  submitted: 'text-amber-400',
  under_review: 'text-purple-400',
  approved: 'text-emerald-400',
  needs_revision: 'text-orange-400',
  flagged: 'text-red-400',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubmissionDetail {
  id: string;
  deliverableId: string;
  deliverableTitle: string;
  status: AccelSubmissionStatus;
  textContent: string | null;
  submittedAt: string | null;
  version: number;
  existingFeedback: string | null;
}

interface ReviewSubmissionsPanelProps {
  submissions: SubmissionDetail[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReviewSubmissionsPanel({
  submissions,
}: ReviewSubmissionsPanelProps) {
  if (submissions.length === 0) {
    return (
      <p className="text-xs text-neutral-600 px-1 py-2">
        No submissions for the current week yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {submissions.map((submission) => (
        <SubmissionReviewRow key={submission.deliverableId} submission={submission} />
      ))}
    </div>
  );
}

// ─── Per-submission row ───────────────────────────────────────────────────────

function SubmissionReviewRow({ submission }: { submission: SubmissionDetail }) {
  const [isExpanded, setIsExpanded] = useState(
    submission.status === 'submitted' || submission.status === 'needs_revision'
  );
  const [localStatus, setLocalStatus] = useState(submission.status);
  const [comments, setComments] = useState(submission.existingFeedback ?? '');
  const [score, setScore] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const hasSubmission = submission.status !== 'not_started';

  const saveReview = async () => {
    if (!submission.id) return;
    setIsSaving(true);
    setSaveError(null);

    const response = await fetch(
      `/api/accelerator/submissions/${submission.id}/review`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: score !== '' ? score : undefined,
          comments: comments || undefined,
          visibility: 'team',
          new_submission_status: localStatus !== submission.status ? localStatus : undefined,
        }),
      }
    );

    setIsSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setSaveError(body.error ?? 'Failed to save review.');
      return;
    }

    setSavedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  };

  return (
    <div
      className={[
        'overflow-hidden rounded-lg border transition-colors',
        isExpanded ? 'border-neutral-700' : 'border-neutral-800',
      ].join(' ')}
    >
      {/* Header row */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        disabled={!hasSubmission}
        className="flex w-full items-center justify-between px-4 py-3 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-200">{submission.deliverableTitle}</span>
          {submission.version > 1 && (
            <span className="text-xs text-neutral-700">v{submission.version}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${STATUS_COLORS[localStatus]}`}>
            {SUBMISSION_STATUS_LABELS[localStatus]}
          </span>
          {hasSubmission &&
            (isExpanded ? (
              <ChevronUp size={13} className="text-neutral-600" />
            ) : (
              <ChevronDown size={13} className="text-neutral-600" />
            ))}
        </div>
      </button>

      {/* Expanded review panel */}
      {isExpanded && hasSubmission && (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-3">
          {/* Submission content */}
          {submission.textContent && (
            <div className="mb-4 rounded-md bg-neutral-900 px-3 py-3">
              <p className="mb-1 text-[10px] uppercase tracking-widest text-neutral-600">
                Submission
              </p>
              <p className="whitespace-pre-wrap text-sm text-neutral-300">
                {submission.textContent}
              </p>
            </div>
          )}

          {!submission.textContent && (
            <p className="mb-4 text-xs text-neutral-600">
              No text content — team may have submitted via link or file.
            </p>
          )}

          {/* Review form */}
          <div className="flex flex-col gap-3">
            {/* Status selector */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Update status</label>
              <select
                value={localStatus}
                onChange={(e) => setLocalStatus(e.target.value as AccelSubmissionStatus)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-neutral-100 focus:outline-none"
              >
                {REVIEWABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SUBMISSION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Score */}
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Score (1–5, optional)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={score}
                onChange={(e) =>
                  setScore(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="—"
                className="w-20 rounded-md border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-700 focus:outline-none"
              />
            </div>

            {/* Comments */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs text-neutral-500">
                <MessageSquare size={11} />
                Feedback for team
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="What should the team know about this submission?"
                className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-neutral-700">
                Visible to the team. Leave blank for internal-only notes.
              </p>
            </div>

            {saveError && (
              <p className="text-xs text-red-400">{saveError}</p>
            )}

            <div className="flex items-center justify-end gap-3">
              {savedAt && (
                <span className="text-xs text-emerald-600">Saved at {savedAt}</span>
              )}
              <button
                onClick={saveReview}
                disabled={isSaving}
                className="rounded-md bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
