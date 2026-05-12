'use client';

import { useState } from 'react';
import type { AccelFundingStatus } from '@/lib/accel-types';
import { FUNDING_STATUS_LABELS } from '@/lib/accel-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamFundingData {
  teamId: string;
  teamName: string;
  milestoneFunding: {
    funding_status: AccelFundingStatus;
    amount_unlocked: number;
    total_award: number;
  } | null;
  submittedDeliverableCount: number;
  totalDeliverableCount: number;
  dilutiveTotal: number;
  nonDilutiveTotal: number;
}

interface OnTrackAssessmentPanelProps {
  teamFundingData: TeamFundingData[];
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

// Derive a recommended funding status from deliverable completion and external momentum.
// Thresholds are rough heuristics — the AggieX team can always override.
function deriveRecommendedStatus(team: TeamFundingData): AccelFundingStatus {
  const completionPct =
    team.totalDeliverableCount > 0
      ? team.submittedDeliverableCount / team.totalDeliverableCount
      : 0;

  const hasExternalCapital = team.dilutiveTotal + team.nonDilutiveTotal > 0;

  if (completionPct >= 0.75 || hasExternalCapital) return 'on_track';
  if (completionPct >= 0.4) return 'paused';
  return 'probation';
}

const STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  paused: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  probation: 'text-red-400 border-red-400/30 bg-red-400/10',
  exited: 'text-neutral-500 border-neutral-700 bg-neutral-800/40',
};

const STATUS_OPTIONS: AccelFundingStatus[] = ['on_track', 'paused', 'probation', 'exited'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnTrackAssessmentPanel({
  teamFundingData,
}: OnTrackAssessmentPanelProps) {
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [savedTeamIds, setSavedTeamIds] = useState<Set<string>>(new Set());

  const updateStatus = async (teamId: string, newStatus: AccelFundingStatus) => {
    setSavingTeamId(teamId);

    await fetch(`/api/accelerator/funding/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funding_status: newStatus }),
    });

    setSavingTeamId(null);
    setSavedTeamIds((prev) => new Set(prev).add(teamId));
  };

  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_80px_150px_150px] gap-4 border-b border-neutral-800 px-4 py-2 text-[10px] font-medium uppercase tracking-widest text-neutral-600">
        <span>Team</span>
        <span className="text-right">Deliverables</span>
        <span className="text-right">Progress</span>
        <span className="text-center">Recommendation</span>
        <span className="text-center">Set status</span>
      </div>

      {/* Team rows */}
      {teamFundingData.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-neutral-600">
          No active teams to assess.
        </p>
      ) : (
        teamFundingData.map((team) => {
          const completionPct =
            team.totalDeliverableCount > 0
              ? Math.round((team.submittedDeliverableCount / team.totalDeliverableCount) * 100)
              : 0;
          const recommended = deriveRecommendedStatus(team);
          const currentStatus = team.milestoneFunding?.funding_status ?? null;
          const isSaving = savingTeamId === team.teamId;
          const wasSaved = savedTeamIds.has(team.teamId);

          return (
            <div
              key={team.teamId}
              className="grid grid-cols-[1fr_80px_80px_150px_150px] items-center gap-4 border-b border-neutral-800 px-4 py-3 last:border-b-0"
            >
              {/* Name */}
              <span className="truncate text-sm text-neutral-200">{team.teamName}</span>

              {/* Deliverable count */}
              <span className="text-right text-xs tabular-nums text-neutral-500">
                {team.submittedDeliverableCount}/{team.totalDeliverableCount}
              </span>

              {/* Progress bar */}
              <div className="flex items-center justify-end gap-2">
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-neutral-600">
                  {completionPct}%
                </span>
              </div>

              {/* Recommendation badge */}
              <div className="flex justify-center">
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_COLORS[recommended]}`}
                >
                  {FUNDING_STATUS_LABELS[recommended]}
                </span>
              </div>

              {/* Status selector + save */}
              <div className="flex items-center justify-center gap-2">
                <select
                  defaultValue={currentStatus ?? 'on_track'}
                  disabled={isSaving}
                  onChange={(e) =>
                    updateStatus(team.teamId, e.target.value as AccelFundingStatus)
                  }
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs
                    text-neutral-200 focus:outline-none disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {FUNDING_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {isSaving && (
                  <span className="text-[10px] text-neutral-600">Saving…</span>
                )}
                {!isSaving && wasSaved && (
                  <span className="text-[10px] text-emerald-600">Saved</span>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Footer note */}
      <div className="border-t border-neutral-800 px-4 py-2">
        <p className="text-[10px] text-neutral-700">
          Recommendations are based on deliverable completion rate and external capital raised.
          Manual status overrides take precedence.
        </p>
      </div>
    </div>
  );
}
