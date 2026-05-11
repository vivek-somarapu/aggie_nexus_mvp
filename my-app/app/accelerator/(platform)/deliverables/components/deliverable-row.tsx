'use client';

import { useState } from 'react';
import type { AccelWeek, AccelTeam, AccelExpectedFormat } from '@/lib/accel-types';
import DeliverableForm from './deliverable-form';

const FORMAT_LABELS: Record<AccelExpectedFormat, string> = {
  any: 'Any',
  text: 'Text',
  link: 'Link',
  file: 'File',
};

export interface DeliverableRowData {
  id: string;
  week_id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  expected_format: AccelExpectedFormat;
  assigned_team_ids: string[] | null;
  // Submission counts per team, computed server-side
  submittedCount: number;
  totalTeamCount: number;
}

interface DeliverableRowProps {
  deliverable: DeliverableRowData;
  teams: Pick<AccelTeam, 'id' | 'name'>[];
  weeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  canEdit: boolean; // aggiex_team only
}

export default function DeliverableRow({
  deliverable,
  teams,
  weeks,
  canEdit,
}: DeliverableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const assignedTeamNames = deliverable.assigned_team_ids
    ? teams
        .filter((t) => deliverable.assigned_team_ids!.includes(t.id))
        .map((t) => t.name)
    : null;

  const allSubmitted =
    deliverable.totalTeamCount > 0 &&
    deliverable.submittedCount === deliverable.totalTeamCount;

  const deleteDeliverable = async () => {
    if (
      !confirm(
        `Delete "${deliverable.title}"? This will also delete all team submissions for it.`
      )
    )
      return;
    setIsPending(true);
    await fetch(`/api/accelerator/deliverables/${deliverable.id}`, {
      method: 'DELETE',
    });
    setIsPending(false);
    setIsDeleted(true);
  };

  if (isDeleted) return null;

  if (isEditing) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-4">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-400">
          Editing deliverable
        </p>
        <DeliverableForm
          weeks={weeks}
          teams={teams}
          existing={deliverable}
          onDone={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 px-4 py-3.5">
      {/* Left: title + meta */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-neutral-100">{deliverable.title}</p>
          <span
            className={[
              'rounded px-1.5 py-0.5 text-xs',
              deliverable.is_required
                ? 'bg-neutral-800 text-neutral-400'
                : 'bg-neutral-900 text-neutral-600',
            ].join(' ')}
          >
            {deliverable.is_required ? 'Required' : 'Optional'}
          </span>
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-500">
            {FORMAT_LABELS[deliverable.expected_format]}
          </span>
        </div>

        {deliverable.description && (
          <p className="mb-1.5 text-xs leading-relaxed text-neutral-500 line-clamp-2">
            {deliverable.description}
          </p>
        )}

        <p className="text-xs text-neutral-600">
          {assignedTeamNames === null
            ? 'All teams'
            : assignedTeamNames.length === 0
            ? 'No teams assigned'
            : assignedTeamNames.join(', ')}
        </p>
      </div>

      {/* Right: submission bar + actions */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {/* Submission progress */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800">
            <div
              className={[
                'h-full rounded-full',
                allSubmitted ? 'bg-emerald-500' : 'bg-amber-500',
              ].join(' ')}
              style={{
                width:
                  deliverable.totalTeamCount > 0
                    ? `${(deliverable.submittedCount / deliverable.totalTeamCount) * 100}%`
                    : '0%',
              }}
            />
          </div>
          <span
            className={[
              'text-xs tabular-nums',
              allSubmitted
                ? 'text-emerald-400'
                : deliverable.submittedCount === 0
                ? 'text-neutral-600'
                : 'text-amber-400',
            ].join(' ')}
          >
            {deliverable.submittedCount}/{deliverable.totalTeamCount}
          </span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            >
              Edit
            </button>
            <button
              onClick={deleteDeliverable}
              disabled={isPending}
              className="rounded px-2 py-0.5 text-xs text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
