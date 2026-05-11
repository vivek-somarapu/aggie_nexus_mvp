'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  AccelCurriculumFileType,
  AccelAccessLevel,
  AccelWeek,
  AccelTeam,
} from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────────────────────

const FILE_TYPE_LABELS: Record<AccelCurriculumFileType, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  video_link: 'Video',
  external_link: 'Link',
  other: 'File',
};

const FILE_TYPE_COLORS: Record<AccelCurriculumFileType, string> = {
  pdf: 'bg-red-500/10 text-red-400',
  docx: 'bg-blue-500/10 text-blue-400',
  video_link: 'bg-purple-500/10 text-purple-400',
  external_link: 'bg-teal-500/10 text-teal-400',
  other: 'bg-neutral-800 text-neutral-400',
};

const FILE_TYPE_CTA: Record<AccelCurriculumFileType, string> = {
  pdf: 'Open PDF',
  docx: 'Download',
  video_link: 'Watch',
  external_link: 'Open',
  other: 'Open',
};

const ACCESS_LEVEL_LABELS: Record<AccelAccessLevel, string> = {
  all: 'Everyone',
  founders_only: 'Founders + Staff',
  aggiex_internal: 'Internal only',
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CurriculumFileData {
  id: string;
  week_id: string | null;
  title: string;
  description: string | null;
  file_type: AccelCurriculumFileType;
  file_url: string;
  access_level: AccelAccessLevel;
  assigned_team_ids: string[] | null;
  is_active: boolean;
  uploaded_at: string;
  accel_weeks: { week_number: number; theme: string } | null;
}

interface CurriculumFileCardProps {
  file: CurriculumFileData;
  isAdmin: boolean;
  canDelete: boolean;
  allWeeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[];
  allTeams: Pick<AccelTeam, 'id' | 'name'>[];
}

// ─── Edit form schema ─────────────────────────────────────────────────────────

const EditSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().max(1000).optional(),
  file_type: z.enum(['pdf', 'docx', 'video_link', 'external_link', 'other']),
  file_url: z.string().url('Must be a valid URL'),
  week_id: z.string().uuid().optional().or(z.literal('')),
  access_level: z.enum(['all', 'founders_only', 'aggiex_internal']),
  all_teams: z.boolean(),
  team_ids: z.array(z.string().uuid()).optional(),
});

type EditValues = z.infer<typeof EditSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CurriculumFileCard({
  file,
  isAdmin,
  canDelete,
  allWeeks,
  allTeams: allTeamsList,
}: CurriculumFileCardProps) {
  const [localFile, setLocalFile] = useState(file);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      title: file.title,
      description: file.description ?? '',
      file_type: file.file_type,
      file_url: file.file_url,
      week_id: file.week_id ?? '',
      access_level: file.access_level,
      all_teams: file.assigned_team_ids === null,
      team_ids: file.assigned_team_ids ?? [],
    },
  });

  const allTeamsChecked = watch('all_teams');
  const selectedTeamIds = watch('team_ids') ?? [];

  const toggleTeam = (teamId: string) => {
    const next = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter((id) => id !== teamId)
      : [...selectedTeamIds, teamId];
    setValue('team_ids', next);
  };

  const cancelEdit = () => {
    reset();
    setServerError(null);
    setIsEditing(false);
  };

  const onSave = async (values: EditValues) => {
    setServerError(null);

    const payload: Record<string, unknown> = {
      title: values.title,
      file_type: values.file_type,
      file_url: values.file_url,
      access_level: values.access_level,
      week_id: values.week_id || null,
      assigned_team_ids: values.all_teams
        ? null
        : (values.team_ids?.length ? values.team_ids : null),
    };

    if (values.description?.trim()) {
      payload.description = values.description.trim();
    } else {
      payload.description = null;
    }

    const response = await fetch(`/api/accelerator/curriculum/${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Save failed.');
      return;
    }

    setLocalFile({
      ...localFile,
      title: values.title,
      description: values.description?.trim() || null,
      file_type: values.file_type,
      file_url: values.file_url,
      week_id: values.week_id || null,
      access_level: values.access_level,
      assigned_team_ids: values.all_teams ? null : (values.team_ids?.length ? values.team_ids : null),
    });
    setIsEditing(false);
  };

  const toggleActive = async () => {
    setIsPending(true);
    const response = await fetch(`/api/accelerator/curriculum/${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !localFile.is_active }),
    });
    setIsPending(false);
    if (response.ok) setLocalFile({ ...localFile, is_active: !localFile.is_active });
  };

  const deleteFile = async () => {
    if (!confirm('Delete this resource permanently? This cannot be undone.')) return;
    setIsPending(true);
    const response = await fetch(`/api/accelerator/curriculum/${file.id}`, { method: 'DELETE' });
    setIsPending(false);
    if (response.ok) setIsDeleted(true);
  };

  if (isEditing) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Editing resource
          </p>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Title</label>
            <input type="text" {...register('title')} className={INPUT_CLASS} />
            {errors.title && <p className={ERROR_CLASS}>{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Description (optional)</label>
            <textarea {...register('description')} rows={2} className={TEXTAREA_CLASS} />
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
              <label className={LABEL_CLASS}>Week</label>
              <select {...register('week_id')} className={INPUT_CLASS}>
                <option value="">Program-wide</option>
                {allWeeks.map((week) => (
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
            <input type="url" {...register('file_url')} className={INPUT_CLASS} />
            {errors.file_url && <p className={ERROR_CLASS}>{errors.file_url.message}</p>}
          </div>

          {/* Access level */}
          <div className="flex flex-col gap-1.5">
            <label className={LABEL_CLASS}>Role visibility</label>
            <select {...register('access_level')} className={INPUT_CLASS}>
              <option value="all">Everyone (founders, mentors, staff)</option>
              <option value="founders_only">Founders + Staff only</option>
              <option value="aggiex_internal">AggieX internal only</option>
            </select>
          </div>

          {/* Team targeting */}
          <div className="flex flex-col gap-2">
            <label className={LABEL_CLASS}>Assign to</label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={allTeamsChecked}
                onChange={(e) => setValue('all_teams', e.target.checked)}
                className="accent-neutral-100"
              />
              All teams
            </label>
            {!allTeamsChecked && (
              <div className="flex flex-col gap-1.5 rounded-md border border-neutral-800 bg-neutral-950 p-3">
                {allTeamsList.length === 0 ? (
                  <p className="text-xs text-neutral-500">No active teams yet.</p>
                ) : (
                  allTeamsList.map((team) => (
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-md bg-neutral-100 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-neutral-800 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (isDeleted) return null;

  // Display mode
  return (
    <div
      className={[
        'rounded-lg border px-4 py-4',
        localFile.is_active
          ? 'border-neutral-800 bg-neutral-950'
          : 'border-neutral-800/50 bg-neutral-950/50 opacity-60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: type badge + title + description */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${FILE_TYPE_COLORS[localFile.file_type]}`}>
              {FILE_TYPE_LABELS[localFile.file_type]}
            </span>

            {isAdmin && (
              <span className="text-xs text-neutral-600">
                {ACCESS_LEVEL_LABELS[localFile.access_level]}
              </span>
            )}

            {isAdmin && !localFile.is_active && (
              <span className="text-xs text-neutral-600">· hidden</span>
            )}
          </div>

          <p className="text-sm font-medium text-neutral-100">{localFile.title}</p>

          {localFile.description && (
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {localFile.description}
            </p>
          )}
        </div>

        {/* Right: open link + admin controls */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <a
            href={localFile.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white"
          >
            {FILE_TYPE_CTA[localFile.file_type]} ↗
          </a>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded px-2 py-0.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              >
                Edit
              </button>

              <button
                onClick={toggleActive}
                disabled={isPending}
                className={[
                  'rounded px-2 py-0.5 text-xs transition-colors disabled:opacity-50',
                  localFile.is_active
                    ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                ].join(' ')}
              >
                {localFile.is_active ? 'Hide' : 'Show'}
              </button>

              {canDelete && (
                <button
                  onClick={deleteFile}
                  disabled={isPending}
                  className="rounded px-2 py-0.5 text-xs text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LABEL_CLASS = 'text-xs font-medium uppercase tracking-widest text-neutral-400';
const ERROR_CLASS = 'text-xs text-red-400';
const INPUT_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
const TEXTAREA_CLASS =
  'w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none';
