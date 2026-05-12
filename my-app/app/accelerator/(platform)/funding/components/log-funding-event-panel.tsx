'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import type { AccelFundType } from '@/lib/accel-types';
import { FUND_TYPE_LABELS } from '@/lib/accel-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
}

interface LogFundingEventPanelProps {
  teams: Team[];
  programId: string;
}

const FUND_TYPE_OPTIONS: AccelFundType[] = ['dilutive', 'non_dilutive'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function LogFundingEventPanel({
  teams,
  programId,
}: LogFundingEventPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [fundType, setFundType] = useState<AccelFundType>('non_dilutive');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [acquiredAt, setAcquiredAt] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setTeamId(teams[0]?.id ?? '');
    setFundType('non_dilutive');
    setAmount('');
    setSource('');
    setAcquiredAt('');
    setNotes('');
    setError(null);
  };

  const close = () => {
    reset();
    setIsOpen(false);
  };

  const submit = async () => {
    if (!teamId || !amount || !source || !acquiredAt) {
      setError('Team, amount, source, and date are required.');
      return;
    }

    setIsPending(true);
    setError(null);

    const response = await fetch('/api/accelerator/funding-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        program_id: programId,
        fund_type: fundType,
        amount: Number(amount),
        source,
        acquired_at: acquiredAt,
        notes: notes || null,
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Failed to log funding event.');
      return;
    }

    close();
    router.refresh();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-neutral-800 px-3 py-2 text-xs
          font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
      >
        <Plus size={13} />
        Log funding event
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-neutral-700 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-200">Log funding event</p>
        <button onClick={close} className="text-neutral-600 hover:text-neutral-400">
          <X size={14} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Team */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Team</label>
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 focus:outline-none"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Fund type</label>
          <select
            value={fundType}
            onChange={(e) => setFundType(e.target.value as AccelFundType)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 focus:outline-none"
          >
            {FUND_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>{FUND_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Amount ($)</label>
          <input
            type="number"
            min="0"
            step="100"
            placeholder="25000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 placeholder:text-neutral-700 focus:outline-none"
          />
        </div>

        {/* Date acquired */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Date acquired</label>
          <input
            type="date"
            value={acquiredAt}
            onChange={(e) => setAcquiredAt(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 focus:outline-none"
          />
        </div>

        {/* Source */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">Source / investor name</label>
          <input
            type="text"
            placeholder="e.g. SBIR Phase I, Angel investor, AggieX program"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 placeholder:text-neutral-700 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Any context about this funding event…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full resize-none rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2
              text-sm text-neutral-100 placeholder:text-neutral-700 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={close}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900
            hover:bg-white disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Log event'}
        </button>
      </div>
    </div>
  );
}
