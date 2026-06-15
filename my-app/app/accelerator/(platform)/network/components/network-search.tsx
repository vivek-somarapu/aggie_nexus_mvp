'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, Lock, CheckCircle2, Loader2, Send } from 'lucide-react';
import type { RelaysResult } from '@/lib/relays';

type IntroStatus = 'idle' | 'requesting' | 'requested';

interface ResultWithIntro extends RelaysResult {
  introStatus: IntroStatus;
}

export default function NetworkSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultWithIntro[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingResultIds, setPendingResultIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Load existing intro requests on mount so buttons show correct state
  useEffect(() => {
    fetch('/api/accelerator/relays/intro')
      .then((r) => r.json())
      .then((data: Array<{ result_id: string }>) => {
        setPendingResultIds(new Set(data.map((r) => r.result_id)));
      })
      .catch(() => {});

    // Provision this user on first network page visit (idempotent)
    fetch('/api/accelerator/relays/provision', { method: 'POST' }).catch(() => {});
  }, []);

  const runSearch = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/accelerator/relays/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setSearchError(error ?? 'Search failed. Please try again.');
        setResults([]);
        return;
      }

      const data = await res.json();
      const enriched: ResultWithIntro[] = (data.results ?? []).map(
        (r: RelaysResult) => ({
          ...r,
          introStatus: pendingResultIds.has(r.result_id) ? 'requested' : 'idle',
        }),
      );
      setResults(enriched);
    } catch {
      setSearchError('Network error. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [pendingResultIds]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    runSearch(query);
  };

  const requestIntro = async (resultId: string, message?: string) => {
    setResults((previous) =>
      previous.map((r) =>
        r.result_id === resultId ? { ...r, introStatus: 'requesting' } : r,
      ),
    );

    try {
      const res = await fetch('/api/accelerator/relays/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: resultId, message }),
      });

      if (res.ok) {
        setPendingResultIds((prev) => new Set(prev).add(resultId));
        setResults((previous) =>
          previous.map((r) =>
            r.result_id === resultId ? { ...r, introStatus: 'requested' } : r,
          ),
        );
      } else {
        setResults((previous) =>
          previous.map((r) =>
            r.result_id === resultId ? { ...r, introStatus: 'idle' } : r,
          ),
        );
      }
    } catch {
      setResults((previous) =>
        previous.map((r) =>
          r.result_id === resultId ? { ...r, introStatus: 'idle' } : r,
        ),
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
          {isSearching ? (
            <Loader2 size={15} className="animate-spin text-neutral-500" />
          ) : (
            <Search size={15} className="text-neutral-500" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by expertise, industry, role…"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-9 pr-4
            text-sm text-neutral-100 placeholder-neutral-600 outline-none
            focus:border-neutral-600 focus:ring-0 transition-colors"
        />
        <button type="submit" className="sr-only">Search</button>
      </form>

      {/* Error */}
      {searchError && (
        <p className="text-sm text-red-400">{searchError}</p>
      )}

      {/* Empty state */}
      {hasSearched && !isSearching && results.length === 0 && !searchError && (
        <div className="rounded-lg border border-neutral-800 px-4 py-14 text-center">
          <p className="text-sm text-neutral-500">No matches found.</p>
          <p className="mt-1 text-xs text-neutral-700">Try a different search — expertise area, industry, or role.</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <ResultCard
              key={result.result_id}
              result={result}
              onRequestIntro={requestIntro}
            />
          ))}
        </div>
      )}

      {/* Hint before first search */}
      {!hasSearched && (
        <div className="rounded-lg border border-neutral-800/50 px-5 py-10 text-center">
          <Search size={24} className="mx-auto mb-3 text-neutral-700" />
          <p className="text-sm text-neutral-500">
            Search for mentors and investors in the AggieX network.
          </p>
          <p className="mt-1 text-xs text-neutral-700">
            Some profiles are anonymized — you can request an intro and a relationship manager will facilitate.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

interface ResultCardProps {
  result: ResultWithIntro;
  onRequestIntro: (resultId: string) => void;
}

function ResultCard({ result, onRequestIntro }: ResultCardProps) {
  const isAnonymized = result.visibility === 'anonymized';

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isAnonymized ? (
              <Lock size={13} className="shrink-0 text-neutral-600" />
            ) : (
              <UserCheck size={13} className="shrink-0 text-emerald-600" />
            )}

            {isAnonymized ? (
              <span className="text-sm font-medium text-neutral-400">
                {result.anon_description ?? 'Anonymous profile'}
              </span>
            ) : (
              <span className="text-sm font-semibold text-neutral-100">
                {result.full_name}
              </span>
            )}
          </div>

          {!isAnonymized && (result.role_title || result.company) && (
            <p className="mt-0.5 pl-5 text-xs text-neutral-500">
              {[result.role_title, result.company].filter(Boolean).join(' · ')}
            </p>
          )}

          {isAnonymized && result.expertise_signals && result.expertise_signals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5 pl-5">
              {result.expertise_signals.map((signal) => (
                <span
                  key={signal}
                  className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Match score */}
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-neutral-700">
          {Math.round(result.score * 100)}% match
        </span>
      </div>

      {/* Intro action */}
      {result.requires_approval && (
        <div className="mt-3 flex justify-end border-t border-neutral-800 pt-3">
          {result.introStatus === 'requested' ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 size={13} />
              Intro requested — a relationship manager will reach out.
            </span>
          ) : (
            <button
              onClick={() => onRequestIntro(result.result_id)}
              disabled={result.introStatus === 'requesting'}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700
                px-3 py-1.5 text-xs text-neutral-300 transition-colors
                hover:border-neutral-500 hover:text-neutral-100
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              {result.introStatus === 'requesting' ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              Request intro
            </button>
          )}
        </div>
      )}
    </div>
  );
}
