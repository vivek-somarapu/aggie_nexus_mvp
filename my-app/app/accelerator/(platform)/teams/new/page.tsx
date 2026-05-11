'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(120),
  industry_vertical: z.string().optional(),
  venture_stage: z.string().optional(),
  entity_type: z.enum(['llc', 'c_corp', 's_corp', 'none', 'other']).default('none'),
  tamu_ip_flag: z.boolean().default(false),
  beachhead_market: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  pitch_deck_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

type CreateTeamValues = z.infer<typeof CreateTeamSchema>;

export default function NewTeamPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamValues>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: { entity_type: 'none', tamu_ip_flag: false },
  });

  const onSubmit = async (values: CreateTeamValues) => {
    setServerError(null);

    const response = await fetch('/api/accelerator/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Failed to create team.');
      return;
    }

    const team = await response.json();
    router.push(`/accelerator/teams/${team.id}`);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Teams
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-100">Add team</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Team name *" error={errors.name?.message}>
          <input
            {...register('name')}
            placeholder="e.g. AgriTech AI"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Industry vertical" error={errors.industry_vertical?.message}>
          <input
            {...register('industry_vertical')}
            placeholder="e.g. AgriTech, FinTech, HealthTech"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Venture stage" error={errors.venture_stage?.message}>
          <input
            {...register('venture_stage')}
            placeholder="e.g. Pre-seed, Idea stage"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Entity type" error={errors.entity_type?.message}>
          <select {...register('entity_type')} className={INPUT_CLASS}>
            <option value="none">Not yet formed</option>
            <option value="llc">LLC</option>
            <option value="c_corp">C Corp</option>
            <option value="s_corp">S Corp</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Beachhead market" error={errors.beachhead_market?.message}>
          <textarea
            {...register('beachhead_market')}
            rows={2}
            placeholder="Describe the smallest, most winnable customer segment"
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Website" error={errors.website?.message}>
          <input
            {...register('website')}
            type="url"
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Pitch deck URL" error={errors.pitch_deck_url?.message}>
          <input
            {...register('pitch_deck_url')}
            type="url"
            placeholder="https://..."
            className={INPUT_CLASS}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            {...register('tamu_ip_flag')}
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-neutral-100"
          />
          <span className="text-sm text-neutral-300">
            IP originated at Texas A&amp;M
          </span>
        </label>

        {serverError && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push('/accelerator/teams')}
            className="rounded-md px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-neutral-100 px-5 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create team'}
          </button>
        </div>
      </form>
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
