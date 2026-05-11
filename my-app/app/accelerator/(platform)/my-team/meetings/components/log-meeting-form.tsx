'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccelMeetingType, AccelWeek } from '@/lib/accel-types';

const MEETING_TYPE_LABELS: Record<AccelMeetingType, string> = {
  mentor_session: 'Mentor Session',
  demo_day: 'Demo Day',
  one_on_one: '1-on-1',
  crucible: 'Crucible',
  speaker_session: 'Speaker Session',
  other: 'Other',
};

const LogMeetingSchema = z.object({
  meeting_type: z.enum([
    'mentor_session', 'demo_day', 'one_on_one', 'crucible', 'speaker_session', 'other',
  ]),
  meeting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
  week_id: z.string().uuid().optional().or(z.literal('')),
  duration_minutes: z.coerce.number().int().min(1).max(480).optional(),
  attendees_raw: z.string().optional(),
  notes: z.string().optional(),
  action_items_raw: z.string().optional(),
});

type LogMeetingValues = z.infer<typeof LogMeetingSchema>;

interface LogMeetingFormProps {
  teamId: string;
  unlockedWeeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  today: string;
}

export default function LogMeetingForm({ teamId, unlockedWeeks, today }: LogMeetingFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogMeetingValues>({
    resolver: zodResolver(LogMeetingSchema),
    defaultValues: {
      meeting_date: today,
      meeting_type: 'mentor_session',
    },
  });

  const onSubmit = async (values: LogMeetingValues) => {
    setServerError(null);

    const attendees = values.attendees_raw
      ? values.attendees_raw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const actionItems = values.action_items_raw
      ? values.action_items_raw.split('\n').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const payload: Record<string, unknown> = {
      team_id: teamId,
      meeting_type: values.meeting_type,
      meeting_date: values.meeting_date,
    };

    if (values.week_id) payload.week_id = values.week_id;
    if (values.duration_minutes) payload.duration_minutes = values.duration_minutes;
    if (attendees?.length) payload.attendees = attendees;
    if (values.notes?.trim()) payload.notes = values.notes.trim();
    if (actionItems?.length) payload.action_items = actionItems;

    const response = await fetch('/api/accelerator/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Failed to log meeting.');
      return;
    }

    setSubmitted(true);
    reset({ meeting_date: today, meeting_type: 'mentor_session' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {submitted && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-400">Meeting logged.</p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-1 text-xs text-neutral-500 hover:text-neutral-300"
          >
            Log another →
          </button>
        </div>
      )}

      {!submitted && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* Meeting type */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Meeting Type</label>
              <select {...register('meeting_type')} className={INPUT_CLASS}>
                {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.meeting_type && (
                <p className={ERROR_CLASS}>{errors.meeting_type.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Date</label>
              <input
                type="date"
                {...register('meeting_date')}
                className={INPUT_CLASS}
              />
              {errors.meeting_date && (
                <p className={ERROR_CLASS}>{errors.meeting_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Week */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Program Week (optional)</label>
              <select {...register('week_id')} className={INPUT_CLASS}>
                <option value="">— none —</option>
                {unlockedWeeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    Week {week.week_number} — {week.theme}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Duration (minutes, optional)</label>
              <input
                type="number"
                min={1}
                max={480}
                {...register('duration_minutes')}
                placeholder="e.g. 60"
                className={INPUT_CLASS}
              />
              {errors.duration_minutes && (
                <p className={ERROR_CLASS}>{errors.duration_minutes.message}</p>
              )}
            </div>
          </div>

          {/* Attendees */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Attendees (optional)</label>
            <p className="text-xs text-neutral-600">Comma-separated names or emails</p>
            <input
              type="text"
              {...register('attendees_raw')}
              placeholder="e.g. John Smith, jane@example.com"
              className={INPUT_CLASS}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Key discussion points, decisions made..."
              className={TEXTAREA_CLASS}
            />
          </div>

          {/* Action items */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Action Items (optional)</label>
            <p className="text-xs text-neutral-600">One per line</p>
            <textarea
              {...register('action_items_raw')}
              rows={3}
              placeholder="Follow up with customer by Friday&#10;Send pitch deck to advisor"
              className={TEXTAREA_CLASS}
            />
          </div>

          {serverError && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
          >
            {isSubmitting ? 'Logging...' : 'Log meeting'}
          </button>
        </>
      )}
    </form>
  );
}

const LABEL_CLASS = 'text-xs font-medium uppercase tracking-widest text-neutral-400';
const ERROR_CLASS = 'text-xs text-red-400';
const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
