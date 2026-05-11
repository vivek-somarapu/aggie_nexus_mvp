import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FUNDING_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelFundingStatus } from '@/lib/accel-types';

const FUNDING_STATUS_COLORS: Record<AccelFundingStatus, string> = {
  on_track: 'text-emerald-400',
  paused: 'text-amber-400',
  probation: 'text-red-400',
  exited: 'text-neutral-500',
};

async function fetchTeamsPageData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['aggiex_team', 'mce_staff'].includes(profile.role)) {
    redirect('/accelerator/dashboard');
  }

  const { data: teams } = await supabase
    .from('accel_teams')
    .select(`
      id, name, logo_url, industry_vertical, venture_stage,
      crucible_outcome, is_active, created_at,
      accel_milestone_funding (funding_status, amount_unlocked, total_award),
      accel_founders (id)
    `)
    .order('name');

  return { teams: teams ?? [], role: profile.role };
}

export default async function TeamsPage() {
  const { teams, role } = await fetchTeamsPageData();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            AggieX Accelerator
          </p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Teams</h1>
        </div>

        {role === 'aggiex_team' && (
          <Link
            href="/accelerator/teams/new"
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
          >
            Add team
          </Link>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No teams yet.</p>
          {role === 'aggiex_team' && (
            <Link
              href="/accelerator/teams/new"
              className="mt-3 inline-block text-sm text-neutral-300 underline underline-offset-2"
            >
              Add the first team
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Vertical</th>
                <th className="px-4 py-3 font-medium">Founders</th>
                <th className="px-4 py-3 font-medium">Funding</th>
                <th className="px-4 py-3 font-medium">Crucible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {teams.map((team: any) => {
                const funding = team.accel_milestone_funding?.[0];
                const founderCount = team.accel_founders?.length ?? 0;

                return (
                  <tr
                    key={team.id}
                    className="group transition-colors hover:bg-neutral-900/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-800 bg-neutral-900">
                          {team.logo_url ? (
                            <Image
                              src={team.logo_url}
                              alt={`${team.name} logo`}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          ) : (
                            <span className="text-xs font-bold text-neutral-600">
                              {team.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/accelerator/teams/${team.id}`}
                            className="font-medium text-neutral-100 group-hover:underline group-hover:underline-offset-2"
                          >
                            {team.name}
                          </Link>
                          {!team.is_active && (
                            <span className="ml-2 text-xs text-neutral-600">(inactive)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {team.industry_vertical ?? '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-400">
                      {founderCount}
                    </td>
                    <td className="px-4 py-3">
                      {funding ? (
                        <span
                          className={`text-xs font-medium ${FUNDING_STATUS_COLORS[funding.funding_status as AccelFundingStatus]}`}
                        >
                          {FUNDING_STATUS_LABELS[funding.funding_status as AccelFundingStatus]}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {team.crucible_outcome ? (
                        <span className="capitalize text-neutral-400">
                          {team.crucible_outcome}
                        </span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
