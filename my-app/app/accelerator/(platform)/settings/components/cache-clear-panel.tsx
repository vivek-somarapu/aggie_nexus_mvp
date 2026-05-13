'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type ClearState =
  | { status: 'idle' }
  | { status: 'clearing' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function CacheClearPanel() {
  const [clearState, setClearState] = useState<ClearState>({ status: 'idle' });

  async function handleClear() {
    setClearState({ status: 'clearing' });

    try {
      const response = await fetch('/api/accelerator/cache', { method: 'POST' });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Error ${response.status}`);
      }
      setClearState({ status: 'success' });
      // Reset back to idle after 4 seconds
      setTimeout(() => setClearState({ status: 'idle' }), 4000);
    } catch (err) {
      setClearState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const isClearing = clearState.status === 'clearing';

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700/40">
            <RefreshCw size={14} className="text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-100">Refresh AI Context Cache</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              The AI Advisor caches program data for 5 minutes to reduce load time. If you&apos;ve
              just added teams, updated records, or changed team status, clear the cache so the AI
              sees the latest data immediately.
            </p>
          </div>
        </div>

        <button
          onClick={handleClear}
          disabled={isClearing}
          className="flex shrink-0 items-center gap-2 rounded-md border border-neutral-700 px-3.5 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isClearing ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Clearing…
            </>
          ) : (
            'Clear cache'
          )}
        </button>
      </div>

      {clearState.status === 'success' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 size={12} />
          Cache cleared — the AI Advisor will fetch live data on the next message.
        </div>
      )}

      {clearState.status === 'error' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={12} />
          {clearState.message}
        </div>
      )}
    </div>
  );
}
