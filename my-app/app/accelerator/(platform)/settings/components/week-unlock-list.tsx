'use client';

import { useState } from 'react';

interface Week {
  id: string;
  week_number: number;
  theme: string;
  start_date: string;
  end_date: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  intensity: string;
}

interface WeekUnlockListProps {
  weeks: Week[];
}

export default function WeekUnlockList({ weeks: initialWeeks }: WeekUnlockListProps) {
  const [weeks, setWeeks] = useState<Week[]>(initialWeeks);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleWeek = async (week: Week) => {
    setPendingId(week.id);
    setError(null);

    const response = await fetch(`/api/accelerator/weeks/${week.id}/unlock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_unlocked: !week.is_unlocked }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Update failed.');
      setPendingId(null);
      return;
    }

    const updated = await response.json();

    setWeeks((prev) =>
      prev.map((w) =>
        w.id === week.id
          ? { ...w, is_unlocked: updated.is_unlocked, unlocked_at: updated.unlocked_at }
          : w
      )
    );

    setPendingId(null);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {weeks.map((week) => {
        const isPast = week.end_date < today;
        const isCurrent = week.start_date <= today && week.end_date >= today;
        const isLoading = pendingId === week.id;

        return (
          <div
            key={week.id}
            className={[
              'flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors',
              week.is_unlocked
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-neutral-800 bg-neutral-900/50',
            ].join(' ')}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-100">
                  Week {week.week_number}
                </span>
                {isCurrent && (
                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-400">
                    Current
                  </span>
                )}
                {isPast && (
                  <span className="text-xs text-neutral-600">Past</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {week.theme}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {formatDate(week.start_date)} – {formatDate(week.end_date)}
              </p>
              {week.is_unlocked && week.unlocked_at && (
                <p className="mt-0.5 text-xs text-emerald-600">
                  Unlocked {formatDate(week.unlocked_at)}
                </p>
              )}
            </div>

            <button
              onClick={() => toggleWeek(week)}
              disabled={isLoading}
              className={[
                'ml-4 shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                week.is_unlocked
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
              ].join(' ')}
            >
              {isLoading ? '...' : week.is_unlocked ? 'Lock' : 'Unlock'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
