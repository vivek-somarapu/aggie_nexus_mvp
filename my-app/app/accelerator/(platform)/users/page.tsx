import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ACCEL_ROLES } from '@/lib/accel-types';
import type { AccelProfile } from '@/lib/accel-types';
import InviteUserModal from './components/invite-user-modal';
import PendingApprovalRow from './components/pending-approval-row';

// ─── Types ───────────────────────────────────────────────────

interface MentorAssignment {
  team_id: string;
  tier: string;
  accel_teams: { name: string } | null;
}

const MENTOR_TIER_LABELS: Record<string, string> = {
  operational: 'Ops',
  domain: 'Domain',
  capital: 'Capital',
};

// ─── Data fetcher ─────────────────────────────────────────────

async function fetchUsersPageData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: callerProfile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'aggiex_team') {
    redirect('/accelerator/dashboard');
  }

  const [profilesResult, teamsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('accel_profiles')
      .select('*')
      .order('created_at', { ascending: false }),

    supabase
      .from('accel_teams')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('accel_mentor_assignments')
      .select('mentor_id, team_id, tier, accel_teams(name)'),
  ]);

  const assignmentsByMentor = new Map<string, MentorAssignment[]>();
  for (const row of assignmentsResult.data ?? []) {
    const existing = assignmentsByMentor.get(row.mentor_id) ?? [];
    existing.push(row as MentorAssignment);
    assignmentsByMentor.set(row.mentor_id, existing);
  }

  return {
    profiles: (profilesResult.data ?? []) as AccelProfile[],
    teams: teamsResult.data ?? [],
    assignmentsByMentor,
  };
}

// ─── Page ─────────────────────────────────────────────────────

export default async function UsersPage() {
  const { profiles, teams, assignmentsByMentor } = await fetchUsersPageData();

  const pendingApprovals = profiles.filter(
    (profile) => !profile.is_active && profile.onboarding_completed_at
  );

  const invitePending = profiles.filter(
    (profile) => !profile.is_active && !profile.onboarding_completed_at
  );

  const activeProfiles = profiles.filter((profile) => profile.is_active);

  const roleGroups = {
    aggiex_team: activeProfiles.filter((profile) => profile.role === 'aggiex_team'),
    mce_staff: activeProfiles.filter((profile) => profile.role === 'mce_staff'),
    mentor: activeProfiles.filter((profile) => profile.role === 'mentor'),
    founder: activeProfiles.filter((profile) => profile.role === 'founder'),
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            AggieX Accelerator
          </p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Users</h1>
        </div>
        <InviteUserModal teams={teams} />
      </div>

      {/* Pending approvals */}
      {pendingApprovals.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-amber-400">
              Pending approval ({pendingApprovals.length})
            </h2>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          </div>

          <div className="overflow-hidden rounded-lg border border-amber-400/20 bg-amber-400/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {pendingApprovals.map((profile) => (
                  <PendingApprovalRow key={profile.id} profile={profile} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-4 gap-3">
        {(Object.entries(roleGroups) as Array<[keyof typeof roleGroups, AccelProfile[]]>).map(
          ([role, members]) => (
            <div key={role} className="rounded-lg border border-neutral-800 px-4 py-4">
              <p className="text-xs text-neutral-500">{ACCEL_ROLES[role]}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
                {members.length}
              </p>
            </div>
          )
        )}
      </div>

      {/* Active users grouped by role */}
      {(Object.entries(roleGroups) as Array<[keyof typeof roleGroups, AccelProfile[]]>).map(
        ([role, members]) => {
          if (members.length === 0) return null;
          const isMentorGroup = role === 'mentor';

          return (
            <section key={role} className="mb-8">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">
                {ACCEL_ROLES[role]} ({members.length})
              </h2>

              <div className="overflow-hidden rounded-lg border border-neutral-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      {isMentorGroup && (
                        <th className="px-4 py-3 font-medium">Assignment</th>
                      )}
                      <th className="px-4 py-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {members.map((profile) => {
                      const mentorAssignments = assignmentsByMentor.get(profile.id) ?? [];

                      return (
                        <tr key={profile.id} className="hover:bg-neutral-900/50">
                          <td className="px-4 py-3 font-medium text-neutral-100">
                            {profile.full_name}
                          </td>
                          <td className="px-4 py-3 text-neutral-400">
                            {profile.email}
                          </td>
                          {isMentorGroup && (
                            <td className="px-4 py-3">
                              <MentorAssignmentCell assignments={mentorAssignments} />
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs text-neutral-500">
                            {new Date(profile.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }
      )}

      {/* Invite pending (accepted invite, onboarding not done) */}
      {invitePending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-600">
            Invite pending ({invitePending.length})
          </h2>

          <div className="overflow-hidden rounded-lg border border-neutral-800/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800/50 text-left text-xs uppercase tracking-wider text-neutral-600">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Invited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/30">
                {invitePending.map((profile) => (
                  <tr key={profile.id} className="opacity-60">
                    <td className="px-4 py-3 text-neutral-300">{profile.full_name}</td>
                    <td className="px-4 py-3 text-neutral-500">{profile.email}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {ACCEL_ROLES[profile.role]}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function MentorAssignmentCell({ assignments }: { assignments: MentorAssignment[] }) {
  if (assignments.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
        Generalist
      </span>
    );
  }

  const tier = assignments[0]?.tier;
  const tierLabel = tier ? MENTOR_TIER_LABELS[tier] : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tierLabel && (
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
          {tierLabel}
        </span>
      )}
      {assignments.map((assignment) => (
        <span
          key={assignment.team_id}
          className="rounded-full bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300"
        >
          {assignment.accel_teams?.name ?? 'Unknown'}
        </span>
      ))}
    </div>
  );
}
