'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const DailyReportSchema = z.object({
  win: z.string().min(1, 'Describe your win for today'),
  blocker: z.string().min(1, 'Describe your main blocker'),
});

type DailyReportValues = z.infer<typeof DailyReportSchema>;

interface ExistingReport {
  id: string;
  win: string;
  blocker: string;
}

interface DailyReportFormProps {
  teamId: string;
  today: string;
  existingReport: ExistingReport | null;
}

export default function DailyReportForm({
  teamId,
  today,
  existingReport,
}: DailyReportFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(!!existingReport);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DailyReportValues>({
    resolver: zodResolver(DailyReportSchema),
    defaultValues: {
      win: existingReport?.win ?? '',
      blocker: existingReport?.blocker ?? '',
    },
  });

  const onSubmit = async (values: DailyReportValues) => {
    setServerError(null);

    const response = await fetch('/api/accelerator/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        report_date: today,
        win: values.win,
        blocker: values.blocker,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Submission failed.');
      return;
    }

    setSubmitted(true);
  };

  if (submitted && !existingReport) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-5 py-5">
        <p className="text-sm font-medium text-emerald-400">Report submitted.</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          You&apos;re done for today. See you tomorrow.
        </p>
      </div>
    );
  }

  if (submitted && existingReport) {
    return (
      <div className="rounded-lg border border-neutral-800 px-5 py-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">
          Today&apos;s Report
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-emerald-600">Win</p>
            <p className="text-sm text-neutral-200">{existingReport.win}</p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-amber-600">Blocker</p>
            <p className="text-sm text-neutral-200">{existingReport.blocker}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-600">
          Already submitted. Contact the AggieX team if you need to make corrections.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest text-emerald-600">
          Win
        </label>
        <p className="text-xs text-neutral-500">What moved forward today?</p>
        <textarea
          {...register('win')}
          rows={3}
          placeholder="e.g. Closed our first paying customer at $200/mo"
          className={TEXTAREA_CLASS}
        />
        {errors.win && (
          <p className="text-xs text-red-400">{errors.win.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-widest text-amber-600">
          Blocker
        </label>
        <p className="text-xs text-neutral-500">What is slowing you down right now?</p>
        <textarea
          {...register('blocker')}
          rows={3}
          placeholder="e.g. Can't get a decision-maker on the phone at our top target account"
          className={TEXTAREA_CLASS}
        />
        {errors.blocker && (
          <p className="text-xs text-red-400">{errors.blocker.message}</p>
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
        {isSubmitting ? 'Submitting...' : 'Submit report'}
      </button>
    </form>
  );
}

const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
