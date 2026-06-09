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

const SOURCE_PRESETS: Record<AccelFundType, string[]> = {
  non_dilutive: ['AggieX Program Milestone', 'SBIR Phase I', 'NSF Grant', 'State Grant'],
  dilutive: ['Angel investor', 'Seed round', 'Pre-seed round', 'Convertible note'],
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LogFundingEventPanel({
  teams,
  programId,
}: LogFundingEventPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [allTeams, setAllTeams] = useState(false);
  const [fundType, setFundType] = useState<AccelFundType>('non_dilutive');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [acquiredAt, setAcquiredAt] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setSelectedTeamIds([]);
    setAllTeams(false);
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

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  }

  function handleAllTeamsChange(checked: boolean) {
    setAllTeams(checked);
    if (checked) setSelectedTeamIds([]);
  }

  const submit = async () => {
    const targetIds = allTeams ? teams.map((t) => t.id) : selectedTeamIds;

    if (targetIds.length === 0) {
      setError('Select at least one team.');
      return;
    }
    if (!amount || !source || !acquiredAt) {
      setError('Amount, source, and date are required.');
      return;
    }

    setIsPending(true);
    setError(null);

    const payload = {
      program_id: programId,
      fund_type: fundType,
      amount: Number(amount),
      source,
      acquired_at: acquiredAt,
      notes: notes || null,
    };

    const results = await Promise.all(
      targetIds.map((teamId) =>
        fetch('/api/accelerator/funding-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, team_id: teamId }),
        })
      )
    );

    setIsPending(false);

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      const body = await failed[0].json().catch(() => ({}));
      setError(body.error ?? `${failed.length} event(s) failed to save.`);
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

      <div className="flex flex-col gap-3">
        {/* Team selection */}
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">Teams receiving this funding</label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300 mb-2">
            <input
              type="checkbox"
              checked={allTeams}
              onChange={(e) => handleAllTeamsChange(e.target.checked)}
              className="accent-neutral-100"
            />
            All teams
          </label>
          {!allTeams && (
            <div className="flex flex-col gap-1.5 rounded-md border border-neutral-800 bg-neutral-950 p-3">
              {teams.length === 0 ? (
                <p className="text-xs text-neutral-600">No active teams.</p>
              ) : (
                teams.map((team) => (
                  <label
                    key={team.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.includes(team.id)}
                      onChange={() => toggleTeam(team.id)}
                      className="accent-neutral-100"
                    />
                    {team.name}
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Fund type */}
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Fund type</label>
            <select
              value={fundType}
              onChange={(e) => setFundType(e.target.value as AccelFundType)}
              className={SELECT_CLASS}
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
              className={INPUT_CLASS}
            />
          </div>

          {/* Date acquired */}
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Date acquired</label>
            <input
              type="date"
              value={acquiredAt}
              onChange={(e) => setAcquiredAt(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {/* Source */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-neutral-500">Source / investor name</label>
            <input
              type="text"
              placeholder="e.g. SBIR Phase I, Angel investor"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className={INPUT_CLASS}
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SOURCE_PRESETS[fundType].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSource(preset)}
                  className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                    source === preset
                      ? 'bg-neutral-600 text-neutral-100'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-neutral-500">Notes (optional)</label>
            <textarea
              rows={2}
              placeholder="Any context about this funding event…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={close} className="text-xs text-neutral-500 hover:text-neutral-300">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-900
            hover:bg-white disabled:opacity-50 transition-colors"
        >
          {isPending
            ? 'Saving…'
            : `Log event${(allTeams ? teams.length : selectedTeamIds.length) > 1
                ? ` for ${allTeams ? teams.length : selectedTeamIds.length} teams`
                : ''}`}
        </button>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2 ' +
  'text-sm text-neutral-100 placeholder:text-neutral-700 focus:outline-none';

const SELECT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2 ' +
  'text-sm text-neutral-100 focus:outline-none';
