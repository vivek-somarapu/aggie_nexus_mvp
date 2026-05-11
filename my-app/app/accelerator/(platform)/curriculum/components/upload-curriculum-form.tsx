'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AccelCurriculumFileType, AccelAccessLevel, AccelWeek, AccelTeam } from '@/lib/accel-types';

const FILE_TYPE_LABELS: Record<AccelCurriculumFileType, string> = {
  pdf: 'PDF',
  docx: 'Word Document',
  video_link: 'Video Link',
  external_link: 'External Link',
  other: 'Other',
};

const ACCESS_LEVEL_LABELS: Record<AccelAccessLevel, string> = {
  all: 'Everyone (founders, mentors, staff)',
  founders_only: 'Founders + Staff only',
  aggiex_internal: 'AggieX internal only',
};

const UploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  file_type: z.enum(['pdf', 'docx', 'video_link', 'external_link', 'other']),
  file_url: z.string().url('Must be a valid URL'),
  week_id: z.string().uuid().optional().or(z.literal('')),
  access_level: z.enum(['all', 'founders_only', 'aggiex_internal']),
  all_teams: z.boolean(),
  team_ids: z.array(z.string().uuid()).optional(),
});

type UploadValues = z.infer<typeof UploadSchema>;

interface UploadCurriculumFormProps {
  weeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  teams: Pick<AccelTeam, 'id' | 'name'>[];
}

export default function UploadCurriculumForm({ weeks, teams }: UploadCurriculumFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [addedTitle, setAddedTitle] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      file_type: 'pdf',
      access_level: 'all',
      all_teams: true,
      team_ids: [],
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

  const onSubmit = async (values: UploadValues) => {
    setServerError(null);

    const payload: Record<string, unknown> = {
      title: values.title,
      file_type: values.file_type,
      file_url: values.file_url,
      access_level: values.access_level,
      assigned_team_ids: values.all_teams
        ? null
        : (values.team_ids?.length ? values.team_ids : null),
    };

    if (values.description?.trim()) payload.description = values.description.trim();
    if (values.week_id) payload.week_id = values.week_id;

    const response = await fetch('/api/accelerator/curriculum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Upload failed.');
      return;
    }

    setAddedTitle(values.title);
    reset();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-end gap-2">
        {addedTitle && (
          <p className="text-xs text-emerald-400">
            &ldquo;{addedTitle}&rdquo; added. Reload to see it in the list.
          </p>
        )}
        <button
          onClick={() => { setIsOpen(true); setAddedTitle(null); }}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
        >
          + Add resource
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">Add curriculum resource</h3>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setServerError(null); reset(); }}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Title</label>
          <input
            type="text"
            {...register('title')}
            placeholder="e.g. Customer Discovery Framework"
            className={INPUT_CLASS}
          />
          {errors.title && <p className={ERROR_CLASS}>{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Description (optional)</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Brief description of what this resource covers..."
            className={TEXTAREA_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* File type */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Type</label>
            <select {...register('file_type')} className={INPUT_CLASS}>
              {Object.entries(FILE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Week */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Week (optional)</label>
            <select {...register('week_id')} className={INPUT_CLASS}>
              <option value="">Program-wide</option>
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  Week {week.week_number} — {week.theme}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* URL */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>URL</label>
          <input
            type="url"
            {...register('file_url')}
            placeholder="https://docs.google.com/... or https://youtube.com/..."
            className={INPUT_CLASS}
          />
          {errors.file_url && <p className={ERROR_CLASS}>{errors.file_url.message}</p>}
        </div>

        {/* Role visibility */}
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS}>Role visibility</label>
          <select {...register('access_level')} className={INPUT_CLASS}>
            {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
          {isSubmitting ? 'Adding...' : 'Add resource'}
        </button>
      </form>
    </div>
  );
}

const LABEL_CLASS = 'text-xs font-medium uppercase tracking-widest text-neutral-400';
const ERROR_CLASS = 'text-xs text-red-400';
const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
