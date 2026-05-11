'use client';

import { useState } from 'react';
import type { InternalDoc } from '../page';

const FILE_TYPE_LABELS = { pdf: 'PDF', docx: 'DOCX', link: 'Link', other: 'File' } as const;
const STATUS_LABELS = { draft: 'Draft', in_review: 'In Review', approved: 'Approved' } as const;
const VISIBILITY_LABELS = { aggiex_only: 'AggieX only', aggiex_mce: 'AggieX + MCE' } as const;
const STATUS_COLORS = {
  draft: 'text-neutral-500',
  in_review: 'text-amber-400',
  approved: 'text-emerald-400',
} as const;

interface DocCardProps {
  doc: InternalDoc;
  isAdmin: boolean;
}

const STATUS_OPTIONS = ['draft', 'in_review', 'approved'] as const;

export default function DocCard({ doc, isAdmin }: DocCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [localStatus, setLocalStatus] = useState(doc.status);
  const [isDeleted, setIsDeleted] = useState(false);

  const updateStatus = async (status: string) => {
    setIsPending(true);
    const response = await fetch(`/api/accelerator/internal-docs/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setIsPending(false);
    if (response.ok) setLocalStatus(status as InternalDoc['status']);
  };

  const deleteDoc = async () => {
    if (!confirm('Delete this document permanently?')) return;
    setIsPending(true);
    const response = await fetch(`/api/accelerator/internal-docs/${doc.id}`, { method: 'DELETE' });
    setIsPending(false);
    if (response.ok) setIsDeleted(true);
  };

  if (isDeleted) return null;

  const uploadedBy = doc.accel_profiles?.full_name ?? 'Unknown';
  const uploadedOn = new Date(doc.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
            {FILE_TYPE_LABELS[doc.file_type]}
          </span>
          <span className="text-xs text-neutral-600">
            {VISIBILITY_LABELS[doc.visibility]}
          </span>
        </div>
        <p className="text-sm font-medium text-neutral-100">{doc.title}</p>
        {doc.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{doc.description}</p>
        )}
        <p className="mt-1.5 text-xs text-neutral-600">
          {uploadedBy} · {uploadedOn}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
        >
          Open ↗
        </a>

        {isAdmin && (
          <div className="flex items-center gap-1.5">
            {/* Cycle status */}
            <select
              value={localStatus}
              disabled={isPending}
              onChange={(e) => updateStatus(e.target.value)}
              className={`rounded bg-neutral-900 px-2 py-0.5 text-xs disabled:opacity-50 focus:outline-none ${STATUS_COLORS[localStatus]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            <button
              onClick={deleteDoc}
              disabled={isPending}
              className="rounded px-2 py-0.5 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
