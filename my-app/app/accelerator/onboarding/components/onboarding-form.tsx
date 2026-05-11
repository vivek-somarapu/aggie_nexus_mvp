'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccelRole } from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  none: 'Not incorporated',
  llc: 'LLC',
  c_corp: 'C-Corp',
  s_corp: 'S-Corp',
  other: 'Other',
};

// ─── Unified schema (founder fields are optional for other roles) ─

const OnboardingSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  // Founder-specific — ignored for other roles
  startup_description: z.string().max(1000).optional(),
  entity_type: z.enum(['llc', 'c_corp', 's_corp', 'none', 'other']).optional(),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  initial_revenue_usd: z.coerce.number().min(0).optional(),
  initial_users: z.coerce.number().min(0).int().optional(),
  initial_lois: z.coerce.number().min(0).int().optional(),
  initial_pilots: z.coerce.number().min(0).int().optional(),
  traction_notes: z.string().max(500).optional(),
});

type OnboardingValues = z.infer<typeof OnboardingSchema>;

// ─── Props ───────────────────────────────────────────────────

interface OnboardingFormProps {
  role: AccelRole;
  fullName: string;
}

// ─── Component ───────────────────────────────────────────────

export default function OnboardingForm({ role, fullName }: OnboardingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isFounder = role === 'founder';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: { full_name: fullName },
  });

  const onSubmit = async (values: OnboardingValues) => {
    setServerError(null);

    const response = await fetch('/api/accelerator/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, role }),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }

    const result = await response.json();

    if (result.message === 'active') {
      router.push('/accelerator/dashboard');
    } else {
      router.push('/accelerator/pending-approval');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
    >
      {/* Full name */}
      <Field label="Full name" error={errors.full_name?.message}>
        <input
          {...register('full_name')}
          placeholder="Jane Smith"
          className={INPUT_CLASS}
        />
      </Field>

      {isFounder && (
        <>
          {/* Startup description */}
          <Field label="Startup description" hint="What does your startup do? (optional)">
            <textarea
              {...register('startup_description')}
              rows={3}
              placeholder="We help X do Y by doing Z..."
              className={TEXTAREA_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Entity type */}
            <Field label="Entity type">
              <select {...register('entity_type')} className={INPUT_CLASS}>
                <option value="">Not selected</option>
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            {/* Website */}
            <Field label="Website" hint="Optional" error={errors.website_url?.message}>
              <input
                type="url"
                {...register('website_url')}
                placeholder="https://yourstartup.com"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          {/* Traction divider */}
          <div className="border-t border-neutral-800 pt-1">
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
              Initial traction snapshot
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Leave blank for any metric that doesn't apply yet. These seed your traction tracker.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Revenue (USD)" hint="Total to date">
              <input
                type="number"
                min={0}
                step="any"
                {...register('initial_revenue_usd')}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Active users">
              <input
                type="number"
                min={0}
                {...register('initial_users')}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Letters of intent">
              <input
                type="number"
                min={0}
                {...register('initial_lois')}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Pilots">
              <input
                type="number"
                min={0}
                {...register('initial_pilots')}
                placeholder="0"
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Traction context" hint="Anything else (optional)">
            <textarea
              {...register('traction_notes')}
              rows={2}
              placeholder="e.g. Soft LOI from HEB, running free pilot with 3 restaurants..."
              className={TEXTAREA_CLASS}
            />
          </Field>
        </>
      )}

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
        {isSubmitting
          ? 'Submitting...'
          : isFounder
          ? 'Submit for review'
          : 'Complete setup'}
      </button>

      {isFounder && (
        <p className="text-center text-xs text-neutral-600">
          An AggieX team member will review and activate your account.
        </p>
      )}
    </form>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-xs font-medium text-neutral-400">{label}</label>
        {hint && <span className="text-xs text-neutral-600">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none resize-none';
