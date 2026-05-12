'use client';

import { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceResult {
  source: string;
  upserted: number;
  skipped: number;
}

interface EmbedResult {
  results: SourceResult[];
  totalUpserted: number;
  totalSkipped: number;
  durationMs: number;
}

type RunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; result: EmbedResult }
  | { status: 'error'; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  accel_curriculum_files: 'Curriculum files',
  accel_deliverables: 'Deliverables',
  accel_submissions: 'Submissions',
  accel_meeting_records: 'Meeting notes',
  accel_context_docs: 'Context docs',
};

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmbedContentPanel() {
  const [runState, setRunState] = useState<RunState>({ status: 'idle' });

  const runEmbedding = async () => {
    setRunState({ status: 'running' });

    let response: Response;
    try {
      response = await fetch('/api/accelerator/embed', { method: 'POST' });
    } catch {
      setRunState({ status: 'error', message: 'Network error — could not reach the server.' });
      return;
    }

    if (response.status === 503) {
      setRunState({
        status: 'error',
        message: 'JINA_API_KEY is not configured. Add it to your Render environment variables.',
      });
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setRunState({
        status: 'error',
        message: (body as { error?: string }).error ?? `Unexpected error (${response.status}).`,
      });
      return;
    }

    const result = (await response.json()) as EmbedResult;
    setRunState({ status: 'success', result });
  };

  const isRunning = runState.status === 'running';

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
            <Database size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-100">Sync AI Knowledge Base</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Indexes curriculum files, deliverables, submissions, and meeting notes so the AI
              Advisor can find relevant content based on context. Run this after uploading new
              curriculum or at the end of each week.
            </p>
          </div>
        </div>

        <button
          onClick={runEmbedding}
          disabled={isRunning}
          className="flex shrink-0 items-center gap-2 rounded-md bg-purple-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Running…
            </>
          ) : (
            'Run now'
          )}
        </button>
      </div>

      {/* ── Result / error block ── */}
      {runState.status === 'success' && (
        <div className="mt-4 rounded-md border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <CheckCircle2 size={13} />
            Completed in {formatDuration(runState.result.durationMs)}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
            {runState.result.results.map((r) => (
              <div key={r.source} className="text-xs text-neutral-400">
                <span className="text-neutral-300">{SOURCE_LABELS[r.source] ?? r.source}</span>
                <br />
                <span className="text-emerald-500">{r.upserted} indexed</span>
                {r.skipped > 0 && (
                  <span className="text-neutral-600"> · {r.skipped} unchanged</span>
                )}
              </div>
            ))}
          </div>
          {runState.result.totalUpserted === 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Everything is already up to date — no changes detected.
            </p>
          )}
        </div>
      )}

      {runState.status === 'error' && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-xs text-red-300">{runState.message}</p>
        </div>
      )}
    </div>
  );
}
