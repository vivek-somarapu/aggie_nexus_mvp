'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import type { AccelEventType, AccelVisibleTo } from '@/lib/accel-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<AccelEventType, string> = {
  speaker_day: 'Speaker Day',
  demo_day: 'Demo Day',
  final_demo_day: 'Final Demo Day',
  social_event: 'Social Event',
  mentor_day: 'Mentor Day',
  one_on_one: '1-on-1 Sessions',
  crucible: 'Crucible',
  week_start: 'Week Start',
  week_end: 'Week End',
  off_day: 'Off Day',
  program_close: 'Program Close',
};

const VISIBLE_TO_LABELS: Record<AccelVisibleTo, string> = {
  all: 'Everyone (founders, mentors, staff)',
  founders: 'Founders + staff',
  mentors: 'Mentors + staff',
  aggiex_team: 'AggieX internal only',
};

const EVENT_TYPE_OPTIONS = Object.keys(EVENT_TYPE_LABELS) as AccelEventType[];
const VISIBLE_TO_OPTIONS = Object.keys(VISIBLE_TO_LABELS) as AccelVisibleTo[];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddEventPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [eventType, setEventType] = useState<AccelEventType>('speaker_day');
  const [eventDate, setEventDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [visibleTo, setVisibleTo] = useState<AccelVisibleTo>('all');

  function reset() {
    setEventType('speaker_day');
    setEventDate('');
    setTitle('');
    setDescription('');
    setIsMandatory(false);
    setVisibleTo('all');
    setError(null);
  }

  function close() {
    reset();
    setIsOpen(false);
  }

  async function submit() {
    if (!eventDate || !title.trim()) {
      setError('Date and title are required.');
      return;
    }

    setIsPending(true);
    setError(null);

    const response = await fetch('/api/accelerator/program-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        event_date: eventDate,
        title: title.trim(),
        description: description.trim() || null,
        is_mandatory: isMandatory,
        visible_to: visibleTo,
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Failed to create event.');
      return;
    }

    close();
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-neutral-800 px-3 py-2 text-xs
          font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
      >
        <Plus size={13} />
        Add event
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-neutral-700 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-200">Add program event</p>
        <button onClick={close} className="text-neutral-600 hover:text-neutral-400">
          <X size={14} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Event type */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Event type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as AccelEventType)}
            className={SELECT_CLASS}
          >
            {EVENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Date</label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {/* Title */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">Title</label>
          <input
            type="text"
            placeholder="e.g. Sarah Chen (a16z) — Fundraising Strategy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className={INPUT_CLASS}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs text-neutral-500">
            Description <span className="text-neutral-600">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Who will be there, what to expect, logistics, links…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>

        {/* Visible to */}
        <div>
          <label className="mb-1 block text-xs text-neutral-500">Visible to</label>
          <select
            value={visibleTo}
            onChange={(e) => setVisibleTo(e.target.value as AccelVisibleTo)}
            className={SELECT_CLASS}
          >
            {VISIBLE_TO_OPTIONS.map((v) => (
              <option key={v} value={v}>{VISIBLE_TO_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {/* Mandatory */}
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="accent-neutral-100"
            />
            Mark as mandatory
          </label>
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
          {isPending ? 'Saving…' : 'Add event'}
        </button>
      </div>
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-sm ' +
  'text-neutral-100 placeholder:text-neutral-700 focus:outline-none';

const SELECT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-2 text-sm ' +
  'text-neutral-100 focus:outline-none';
