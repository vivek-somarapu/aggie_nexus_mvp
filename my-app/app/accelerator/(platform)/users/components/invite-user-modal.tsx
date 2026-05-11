'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ACCEL_ROLES } from '@/lib/accel-types';
import type { AccelRole } from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────

const MENTOR_TIER_LABELS = {
  operational: 'Operational',
  domain: 'Domain Expert',
  capital: 'Capital / Investor',
} as const;

// ─── Schema ──────────────────────────────────────────────────

const InviteFormSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    full_name: z.string().min(1, 'Name is required'),
    role: z.enum(['founder', 'aggiex_team', 'mce_staff', 'mentor'] as const),
    team_id: z.string().optional(),
    mentor_tier: z.enum(['operational', 'domain', 'capital']).optional(),
    mentor_all_teams: z.boolean().optional(),
    mentor_team_ids: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !(data.role === 'founder' && !data.team_id),
    { message: 'Select a team for founder invites', path: ['team_id'] }
  )
  .refine(
    (data) => !(data.role === 'mentor' && !data.mentor_tier),
    { message: 'Select a mentor tier', path: ['mentor_tier'] }
  );

type InviteFormValues = z.infer<typeof InviteFormSchema>;

// ─── Props ───────────────────────────────────────────────────

interface Team {
  id: string;
  name: string;
}

interface InviteUserModalProps {
  teams: Team[];
}

// ─── Component ───────────────────────────────────────────────

export default function InviteUserModal({ teams }: InviteUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(InviteFormSchema),
    defaultValues: {
      role: 'founder',
      mentor_all_teams: true,
      mentor_team_ids: [],
    },
  });

  const selectedRole = watch('role');
  const mentorAllTeams = watch('mentor_all_teams');
  const mentorTeamIds = watch('mentor_team_ids') ?? [];

  const toggleMentorTeam = (teamId: string) => {
    const next = mentorTeamIds.includes(teamId)
      ? mentorTeamIds.filter((id) => id !== teamId)
      : [...mentorTeamIds, teamId];
    setValue('mentor_team_ids', next);
  };

  const onSubmit = async (values: InviteFormValues) => {
    setServerError(null);

    const payload: Record<string, unknown> = {
      email: values.email,
      full_name: values.full_name,
      role: values.role,
    };

    if (values.role === 'founder') {
      payload.team_id = values.team_id;
    }

    if (values.role === 'mentor') {
      payload.mentor_tier = values.mentor_tier;
      payload.mentor_team_ids = values.mentor_all_teams
        ? null
        : (values.mentor_team_ids?.length ? values.mentor_team_ids : null);
    }

    const response = await fetch('/api/accelerator/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setServerError(data.error ?? 'Invite failed. Try again.');
      return;
    }

    reset();
    setIsOpen(false);
  };

  const handleClose = () => {
    reset();
    setServerError(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
      >
        Invite user
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-neutral-100">Invite user</h2>
              <p className="mt-1 text-sm text-neutral-400">
                They'll receive an email to set their password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Full name */}
              <Field label="Full name" error={errors.full_name?.message}>
                <input
                  {...register('full_name')}
                  placeholder="Jane Smith"
                  className={INPUT_CLASS}
                />
              </Field>

              {/* Email */}
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="jane@startup.com"
                  className={INPUT_CLASS}
                />
              </Field>

              {/* Role */}
              <Field label="Role" error={errors.role?.message}>
                <select {...register('role')} className={INPUT_CLASS}>
                  {(Object.entries(ACCEL_ROLES) as Array<[AccelRole, string]>).map(
                    ([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    )
                  )}
                </select>
              </Field>

              {/* Founder: team required */}
              {selectedRole === 'founder' && (
                <Field label="Team" error={errors.team_id?.message}>
                  <select {...register('team_id')} className={INPUT_CLASS}>
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Mentor: tier + team assignment */}
              {selectedRole === 'mentor' && (
                <>
                  <Field label="Mentor tier" error={errors.mentor_tier?.message}>
                    <select {...register('mentor_tier')} className={INPUT_CLASS}>
                      <option value="">Select a tier</option>
                      {(Object.entries(MENTOR_TIER_LABELS) as Array<[string, string]>).map(
                        ([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        )
                      )}
                    </select>
                  </Field>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-neutral-400">Team assignment</p>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
                      <input
                        type="checkbox"
                        checked={mentorAllTeams ?? true}
                        onChange={(e) => setValue('mentor_all_teams', e.target.checked)}
                        className="accent-neutral-100"
                      />
                      Generalist — available to all teams
                    </label>

                    {!mentorAllTeams && (
                      <div className="mt-1 flex flex-col gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 p-3">
                        <p className="mb-1 text-xs text-neutral-500">
                          Select specific teams for this mentor:
                        </p>
                        {teams.length === 0 ? (
                          <p className="text-xs text-neutral-600">No active teams yet.</p>
                        ) : (
                          teams.map((team) => (
                            <label
                              key={team.id}
                              className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300 hover:text-neutral-100"
                            >
                              <input
                                type="checkbox"
                                checked={mentorTeamIds.includes(team.id)}
                                onChange={() => toggleMentorTeam(team.id)}
                                className="accent-neutral-100"
                              />
                              {team.name}
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Server error */}
              {serverError && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {serverError}
                </p>
              )}

              {/* Actions */}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

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
