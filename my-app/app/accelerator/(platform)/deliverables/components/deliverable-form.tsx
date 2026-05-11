'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccelWeek, AccelTeam, AccelExpectedFormat } from '@/lib/accel-types';

const FORMAT_LABELS: Record<AccelExpectedFormat, string> = {
  any: 'Any format',
  text: 'Text response',
  link: 'Link / URL',
  file: 'File upload',
};

const DeliverableFormSchema = z.object({
  week_id: z.string().uuid('Select a week'),
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  is_required: z.boolean(),
  expected_format: z.enum(['file', 'text', 'link', 'any']),
  all_teams: z.boolean(),
  team_ids: z.array(z.string().uuid()).optional(),
});

type DeliverableFormValues = z.infer<typeof DeliverableFormSchema>;

interface DeliverableFormProps {
  weeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  teams: Pick<AccelTeam, 'id' | 'name'>[];
  // When editing, pass the existing deliverable
  existing?: {
    id: string;
    week_id: string;
    title: string;
    description: string | null;
    is_required: boolean;
    expected_format: AccelExpectedFormat;
    assigned_team_ids: string[] | null;
  };
  onDone: () => void;
}

export default function DeliverableForm({
  weeks,
  teams,
  existing,
  onDone,
}: DeliverableFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = !!existing;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeliverableFormValues>({
    resolver: zodResolver(DeliverableFormSchema),
    defaultValues: {
      week_id: existing?.week_id ?? '',
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      is_required: existing?.is_required ?? true,
      expected_format: existing?.expected_format ?? 'any',
      all_teams: existing?.assigned_team_ids === null,
      team_ids: existing?.assigned_team_ids ?? [],
    },
  });

  const allTeams = watch('all_teams');
  const selectedTeamIds = watch('team_ids') ?? [];

  const toggleTeam = (teamId: string) => {
    const next = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter((id) => id !== teamId)
      : [...selectedTeamIds, teamId];
    setValue('team_ids', next);
  };

  const onSubmit = async (values: DeliverableFormValues) => {
    setServerError(null);

    const payload = {
      week_id: values.week_id,
      title: values.title,
      description: values.description?.trim() || null,
      is_required: values.is_required,
      expected_format: values.expected_format,
      assigned_team_ids: values.all_teams
        ? null
        : (values.team_ids?.length ? values.team_ids : null),
    };

    const url = isEditing
      ? `/api/accelerator/deliverables/${existing.id}`
      : '/api/accelerator/deliverables';

    const response = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Save failed.');
      return;
    }

    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Week */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Week</label>
        <select {...register('week_id')} className={INPUT_CLASS} disabled={isEditing}>
          <option value="">— select a week —</option>
          {weeks.map((week) => (
            <option key={week.id} value={week.id}>
              Week {week.week_number} — {week.theme}
            </option>
          ))}
        </select>
        {errors.week_id && <p className={ERROR_CLASS}>{errors.week_id.message}</p>}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Title</label>
        <input
          type="text"
          {...register('title')}
          placeholder="e.g. Customer Discovery Interview Summary"
          className={INPUT_CLASS}
        />
        {errors.title && <p className={ERROR_CLASS}>{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS}>Description (optional)</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Instructions, context, or grading criteria..."
          className={TEXTAREA_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Expected format</label>
          <select {...register('expected_format')} className={INPUT_CLASS}>
            {Object.entries(FORMAT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Required */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Required?</label>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-1.5 text-sm text-neutral-300 cursor-pointer">
              <input
                type="radio"
                {...register('is_required')}
                value="true"
                onChange={() => setValue('is_required', true)}
                checked={watch('is_required') === true}
                className="accent-neutral-100"
              />
              Required
            </label>
            <label className="flex items-center gap-1.5 text-sm text-neutral-300 cursor-pointer">
              <input
                type="radio"
                {...register('is_required')}
                value="false"
                onChange={() => setValue('is_required', false)}
                checked={watch('is_required') === false}
                className="accent-neutral-100"
              />
              Optional
            </label>
          </div>
        </div>
      </div>

      {/* Team targeting */}
      <div className="flex flex-col gap-2">
        <label className={LABEL_CLASS}>Assign to</label>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={allTeams}
            onChange={(e) => setValue('all_teams', e.target.checked)}
            className="accent-neutral-100"
          />
          All teams
        </label>

        {!allTeams && (
          <div className="mt-1 flex flex-col gap-1.5 rounded-md border border-neutral-800 bg-neutral-950 p-3">
            {teams.length === 0 ? (
              <p className="text-xs text-neutral-500">No active teams yet.</p>
            ) : (
              teams.map((team) => (
                <label
                  key={team.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    className="accent-neutral-100"
                  />
                  {team.name}
                </label>
              ))
            )}
          </div>
        )}

        {!allTeams && selectedTeamIds.length === 0 && (
          <p className="text-xs text-amber-500">
            No teams selected — this will behave the same as "all teams".
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {serverError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-md bg-neutral-100 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save changes' : 'Create deliverable'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const LABEL_CLASS = 'text-xs font-medium uppercase tracking-widest text-neutral-400';
const ERROR_CLASS = 'text-xs text-red-400';
const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none disabled:opacity-50';
const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
