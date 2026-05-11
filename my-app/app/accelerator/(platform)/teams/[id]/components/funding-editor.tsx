'use client';

import { useState } from 'react';
import { FUNDING_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelFundingStatus } from '@/lib/accel-types';

// ─── Types ───────────────────────────────────────────────────

interface FundingRow {
  funding_status: string;
  amount_unlocked: number;
  total_award: number;
}

interface FundingEditorProps {
  teamId: string;
  funding: FundingRow | null;
}

const STATUS_OPTIONS: AccelFundingStatus[] = ['on_track', 'paused', 'probation', 'exited'];

const STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400',
  paused: 'text-amber-400',
  probation: 'text-red-400',
  exited: 'text-neutral-500',
};

// ─── Component ───────────────────────────────────────────────

export default function FundingEditor({ teamId, funding }: FundingEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [current, setCurrent] = useState<FundingRow>(
    funding ?? { funding_status: 'on_track', amount_unlocked: 0, total_award: 0 }
  );
  const [draft, setDraft] = useState(current);

  const save = async () => {
    setIsPending(true);
    const response = await fetch(`/api/accelerator/funding/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        funding_status: draft.funding_status,
        amount_unlocked: draft.amount_unlocked,
        total_award: draft.total_award,
      }),
    });
    setIsPending(false);
    if (response.ok) {
      const updated = await response.json();
      setCurrent(updated);
      setIsEditing(false);
    }
  };

  const cancel = () => {
    setDraft(current);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="text-right">
        <p className={`text-sm font-medium ${STATUS_COLORS[current.funding_status as AccelFundingStatus] ?? 'text-neutral-400'}`}>
          {FUNDING_STATUS_LABELS[current.funding_status as AccelFundingStatus] ?? current.funding_status}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">
          ${Number(current.amount_unlocked).toLocaleString()} / ${Number(current.total_award).toLocaleString()}
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="mt-1.5 text-xs text-neutral-600 hover:text-neutral-400"
        >
          Edit funding
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-right">
      <select
        value={draft.funding_status}
        onChange={(e) => setDraft({ ...draft, funding_status: e.target.value })}
        className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{FUNDING_STATUS_LABELS[s]}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Unlocked ($)</label>
          <input
            type="number"
            min={0}
            value={draft.amount_unlocked}
            onChange={(e) => setDraft({ ...draft, amount_unlocked: Number(e.target.value) })}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Total award ($)</label>
          <input
            type="number"
            min={0}
            value={draft.total_award}
            onChange={(e) => setDraft({ ...draft, total_award: Number(e.target.value) })}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={cancel} className="text-xs text-neutral-500 hover:text-neutral-300">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={isPending}
          className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
