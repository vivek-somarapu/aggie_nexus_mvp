'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccelMetricType, AccelWeek } from '@/lib/accel-types';

const METRIC_TYPE_LABELS: Record<AccelMetricType, string> = {
  revenue: 'Revenue',
  users: 'Active Users',
  lois: 'Letters of Intent',
  pilots: 'Pilots',
  retention: 'Retention Rate',
  churn: 'Churn Rate',
  other: 'Other',
};

const METRIC_UNIT_SUGGESTIONS: Record<AccelMetricType, string> = {
  revenue: 'USD/mo',
  users: 'users',
  lois: 'LOIs',
  pilots: 'pilots',
  retention: '%',
  churn: '%',
  other: '',
};

const LogTractionSchema = z.object({
  metric_type: z.enum(['revenue', 'users', 'lois', 'pilots', 'retention', 'churn', 'other']),
  value: z.coerce.number(),
  unit: z.string().min(1, 'Unit is required').max(60),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required'),
  week_id: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().optional(),
  source_evidence_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type LogTractionValues = z.infer<typeof LogTractionSchema>;

interface LogTractionFormProps {
  teamId: string;
  unlockedWeeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  today: string;
}

export default function LogTractionForm({ teamId, unlockedWeeks, today }: LogTractionFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogTractionValues>({
    resolver: zodResolver(LogTractionSchema),
    defaultValues: {
      metric_type: 'revenue',
      entry_date: today,
      unit: 'USD/mo',
    },
  });

  const selectedMetricType = watch('metric_type') as AccelMetricType;

  const onMetricTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const metricType = event.target.value as AccelMetricType;
    setValue('metric_type', metricType);
    setValue('unit', METRIC_UNIT_SUGGESTIONS[metricType]);
  };

  const onSubmit = async (values: LogTractionValues) => {
    setServerError(null);

    const payload: Record<string, unknown> = {
      team_id: teamId,
      metric_type: values.metric_type,
      value: values.value,
      unit: values.unit,
      entry_date: values.entry_date,
    };

    if (values.week_id) payload.week_id = values.week_id;
    if (values.notes?.trim()) payload.notes = values.notes.trim();
    if (values.source_evidence_url?.trim()) payload.source_evidence_url = values.source_evidence_url.trim();

    const response = await fetch('/api/accelerator/traction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Failed to log traction entry.');
      return;
    }

    setSubmitted(true);
    reset({ metric_type: 'revenue', entry_date: today, unit: 'USD/mo' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {submitted && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-400">Traction entry logged.</p>
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
            {/* Metric type */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Metric</label>
              <select
                {...register('metric_type')}
                onChange={onMetricTypeChange}
                className={INPUT_CLASS}
              >
                {Object.entries(METRIC_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Date</label>
              <input
                type="date"
                {...register('entry_date')}
                className={INPUT_CLASS}
              />
              {errors.entry_date && (
                <p className={ERROR_CLASS}>{errors.entry_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Value */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Value</label>
              <input
                type="number"
                step="any"
                {...register('value')}
                placeholder={selectedMetricType === 'revenue' ? '2500' : '42'}
                className={INPUT_CLASS}
              />
              {errors.value && (
                <p className={ERROR_CLASS}>{errors.value.message}</p>
              )}
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL_CLASS}>Unit</label>
              <input
                type="text"
                {...register('unit')}
                placeholder="USD/mo, users, %..."
                className={INPUT_CLASS}
              />
              {errors.unit && (
                <p className={ERROR_CLASS}>{errors.unit.message}</p>
              )}
            </div>
          </div>

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

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Notes (optional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Context, methodology, or caveats..."
              className={TEXTAREA_CLASS}
            />
          </div>

          {/* Evidence URL */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Evidence URL (optional)</label>
            <input
              type="url"
              {...register('source_evidence_url')}
              placeholder="https://stripe.com/dashboard/..."
              className={INPUT_CLASS}
            />
            {errors.source_evidence_url && (
              <p className={ERROR_CLASS}>{errors.source_evidence_url.message}</p>
            )}
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
            {isSubmitting ? 'Logging...' : 'Log traction'}
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
