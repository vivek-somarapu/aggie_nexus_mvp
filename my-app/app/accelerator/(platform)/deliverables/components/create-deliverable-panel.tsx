'use client';

import { useState } from 'react';
import type { AccelWeek, AccelTeam } from '@/lib/accel-types';
import DeliverableForm from './deliverable-form';

interface CreateDeliverablePanelProps {
  weeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  teams: Pick<AccelTeam, 'id' | 'name'>[];
}

export default function CreateDeliverablePanel({
  weeks,
  teams,
}: CreateDeliverablePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
      >
        + Create deliverable
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">New deliverable</h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
      </div>
      <DeliverableForm
        weeks={weeks}
        teams={teams}
        onDone={() => setIsOpen(false)}
      />
    </div>
  );
}
