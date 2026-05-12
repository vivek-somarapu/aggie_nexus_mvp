'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelSubmissionStatus } from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'bg-neutral-800 text-neutral-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  submitted: 'bg-amber-500/10 text-amber-400',
  under_review: 'bg-purple-500/10 text-purple-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  needs_revision: 'bg-orange-500/10 text-orange-400',
  flagged: 'bg-red-500/10 text-red-400',
};

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  expected_format: string;
  is_required: boolean;
  submission: {
    id: string;
    status: string;
    text_content: string | null;
    version: number;
  } | null;
  // Team-visible review feedback, fetched server-side
  feedback?: string | null;
}

interface SubmitDeliverablePanelProps {
  deliverable: Deliverable;
  teamId: string;
}

export default function SubmitDeliverablePanel({
  deliverable,
  teamId,
}: SubmitDeliverablePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [textContent, setTextContent] = useState(
    deliverable.submission?.text_content ?? ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(
    deliverable.submission?.status ?? 'not_started'
  );

  const canSubmit = localStatus !== 'approved';

  const handleSubmit = async () => {
    if (!textContent.trim() && deliverable.expected_format === 'text') {
      setSubmitError('Content is required.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch('/api/accelerator/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverable_id: deliverable.id,
        team_id: teamId,
        status: 'submitted',
        text_content: textContent || null,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = await response.json();
      setSubmitError(data.error ?? 'Submission failed.');
      return;
    }

    setLocalStatus('submitted');
    setIsExpanded(false);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch('/api/accelerator/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverable_id: deliverable.id,
        team_id: teamId,
        status: 'in_progress',
        text_content: textContent || null,
      }),
    });

    setIsSubmitting(false);
    if (response.ok) setLocalStatus('in_progress');
  };

  return (
    <div className={[
      'overflow-hidden rounded-lg border transition-colors',
      isExpanded ? 'border-neutral-700' : 'border-neutral-800',
    ].join(' ')}>
      {/* Header row — always visible */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-200">{deliverable.title}</span>
          {deliverable.is_required && (
            <span className="text-xs text-neutral-600">Required</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[localStatus as AccelSubmissionStatus] ?? 'bg-neutral-800 text-neutral-500'}`}>
            {SUBMISSION_STATUS_LABELS[localStatus as AccelSubmissionStatus] ?? localStatus}
          </span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-neutral-500" />
          ) : (
            <ChevronDown size={14} className="text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-3">
          {/* Feedback from AggieX — shown prominently when revision needed */}
          {deliverable.feedback &&
            (localStatus === 'needs_revision' || localStatus === 'flagged') && (
              <div className="mb-4 flex items-start gap-2.5 rounded-md border border-orange-500/25 bg-orange-500/5 px-3 py-3">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-400" />
                <div>
                  <p className="text-xs font-medium text-orange-400">Feedback from AggieX</p>
                  <p className="mt-1 text-sm text-neutral-300">{deliverable.feedback}</p>
                </div>
              </div>
            )}

          {/* Approved message */}
          {localStatus === 'approved' && (
            <div className="mb-4 flex items-center gap-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <p className="text-sm text-emerald-300">Approved — no further action needed.</p>
            </div>
          )}

          {deliverable.description && (
            <p className="mb-3 text-sm text-neutral-400">{deliverable.description}</p>
          )}

          {/* Text input for text/any format */}
          {['text', 'any'].includes(deliverable.expected_format) && (
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                {deliverable.expected_format === 'text' ? 'Response' : 'Text content (optional if uploading a file)'}
              </label>
              <textarea
                rows={4}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Write your response here..."
                disabled={!canSubmit}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* Link input */}
          {['link', 'any'].includes(deliverable.expected_format) && (
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                {deliverable.expected_format === 'link' ? 'URL *' : 'Link (optional)'}
              </label>
              <input
                type="url"
                placeholder="https://..."
                disabled={!canSubmit}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* File upload notice */}
          {['file', 'any'].includes(deliverable.expected_format) && (
            <div className="mb-3 rounded-md border border-dashed border-neutral-700 px-4 py-4 text-center">
              <p className="text-xs text-neutral-500">
                File upload — coming in the next update.
                Paste a Dropbox or Google Drive link above for now.
              </p>
            </div>
          )}

          {submitError && (
            <p className="mb-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {submitError}
            </p>
          )}

          {canSubmit && (
            <div className="flex justify-end gap-2">
              {['text', 'any'].includes(deliverable.expected_format) && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="rounded-md px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-50"
                >
                  Save draft
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-md bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          )}

          {deliverable.submission?.version && deliverable.submission.version > 1 && (
            <p className="mt-2 text-xs text-neutral-600">
              Version {deliverable.submission.version}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
