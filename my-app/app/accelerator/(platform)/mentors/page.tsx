import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import type { AccelRole, AccelMentorTier } from '@/lib/accel-types';
import {
  AGGIEX_2026_PROGRAM_ID,
  MENTOR_TIER_LABELS,
} from '@/lib/accel-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<AccelMentorTier, string> = {
  operational: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  domain: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  capital: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface MentorWithAssignments {
  id: string;
  fullName: string;
  email: string;
  bio: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  expertiseTags: string[];
  tier: AccelMentorTier;
  isActive: boolean;
  assignedTeams: Array<{
    teamId: string;
    teamName: string;
    tier: AccelMentorTier;
    assignedWeeks: number[] | null;
    commitmentSigned: boolean;
    assignedAt: string;
  }>;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchMentorsData() {
  const supabase = await createClient();

  const [mentorProfilesResult, assignmentsResult, teamsResult, accelProfilesResult] =
    await Promise.all([
      // Extended mentor profiles (if they exist)
      supabase
        .from('accel_mentor_profiles')
        .select('*')
        .eq('is_active', true)
        .order('full_name'),

      // All mentor assignments for this program's teams
      supabase
        .from('accel_mentor_assignments')
        .select(`
          id, mentor_id, team_id, tier, assigned_weeks,
          commitment_signed, commitment_signed_at, notes, created_at,
          accel_teams!inner (id, name, program_id)
        `)
        .eq('accel_teams.program_id', AGGIEX_2026_PROGRAM_ID)
        .order('created_at', { ascending: false }),

      supabase
        .from('accel_teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),

      // Fall back to accel_profiles for mentors without extended profiles
      supabase
        .from('accel_profiles')
        .select('id, full_name, email')
        .eq('role', 'mentor')
        .eq('is_active', true)
        .order('full_name'),
    ]);

  const mentorProfiles = mentorProfilesResult.data ?? [];
  const assignments = assignmentsResult.data ?? [];
  const teams = teamsResult.data ?? [];
  const accelProfiles = accelProfilesResult.data ?? [];

  // Build a map of team info for fast lookup
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Build a map of extended mentor profiles keyed by user id
  const extendedProfileById = new Map(mentorProfiles.map((p) => [p.id, p]));

  // Group assignments by mentor id
  const assignmentsByMentor = new Map<string, typeof assignments>();
  for (const assignment of assignments) {
    const existing = assignmentsByMentor.get(assignment.mentor_id) ?? [];
    existing.push(assignment);
    assignmentsByMentor.set(assignment.mentor_id, existing);
  }

  // Build final mentor list. Prefer extended profile data but fall back to accel_profile.
  const mentorIds = new Set<string>();
  for (const profile of mentorProfiles) mentorIds.add(profile.id);
  for (const profile of accelProfiles) mentorIds.add(profile.id);

  const mentors: MentorWithAssignments[] = Array.from(mentorIds)
    .map((mentorId) => {
      const extended = extendedProfileById.get(mentorId);
      const basic = accelProfiles.find((p) => p.id === mentorId);

      if (!extended && !basic) return null;

      const fullName = extended?.full_name ?? basic?.full_name ?? 'Unknown';
      const email = extended?.email ?? basic?.email ?? '';

      const mentorAssignments = assignmentsByMentor.get(mentorId) ?? [];
      const assignedTeams = mentorAssignments.map((a) => {
        const teamName =
          (a.accel_teams as { name: string } | null)?.name ??
          teamById.get(a.team_id)?.name ??
          'Unknown team';
        return {
          teamId: a.team_id,
          teamName,
          tier: a.tier as AccelMentorTier,
          assignedWeeks: a.assigned_weeks as number[] | null,
          commitmentSigned: a.commitment_signed,
          assignedAt: a.created_at,
        };
      });

      return {
        id: mentorId,
        fullName,
        email,
        bio: extended?.bio ?? null,
        company: extended?.company ?? null,
        title: extended?.title ?? null,
        linkedinUrl: extended?.linkedin_url ?? null,
        expertiseTags: (extended?.expertise_tags as string[]) ?? [],
        tier: (extended?.tier as AccelMentorTier) ?? 'domain',
        isActive: extended?.is_active ?? true,
        assignedTeams,
      };
    })
    .filter((m): m is MentorWithAssignments => m !== null)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return { mentors, teams };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MentorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const role = profile.role as AccelRole;

  // Founders and mentors can view mentors; only aggiex_team sees this route per sidebar
  if (role !== 'aggiex_team' && role !== 'mce_staff') {
    redirect('/accelerator/dashboard');
  }

  const { mentors, teams } = await fetchMentorsData();

  const totalAssignments = mentors.reduce((sum, m) => sum + m.assignedTeams.length, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">People</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Mentors</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {mentors.length} mentor{mentors.length !== 1 ? 's' : ''} · {totalAssignments} team
            assignment{totalAssignments !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {/* ── Mentor cards ── */}
      {mentors.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 px-4 py-16 text-center">
          <p className="text-sm text-neutral-500">No mentors found.</p>
          <p className="mt-1 text-xs text-neutral-700">
            Invite mentors via the Users page to populate this roster.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
            >
              {/* Mentor header */}
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-neutral-100">{mentor.fullName}</h3>
                    <span
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TIER_COLORS[mentor.tier]}`}
                    >
                      {MENTOR_TIER_LABELS[mentor.tier]}
                    </span>
                  </div>

                  {(mentor.title || mentor.company) && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[mentor.title, mentor.company].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <p className="mt-0.5 text-xs text-neutral-700">{mentor.email}</p>

                  {mentor.bio && (
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500 line-clamp-2">
                      {mentor.bio}
                    </p>
                  )}

                  {mentor.expertiseTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {mentor.expertiseTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {mentor.linkedinUrl && (
                  <a
                    href={mentor.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-xs text-neutral-600
                      hover:text-neutral-300 transition-colors"
                  >
                    <ExternalLink size={12} />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Assigned teams */}
              {mentor.assignedTeams.length > 0 && (
                <div className="border-t border-neutral-800">
                  <p className="px-5 py-2 text-[10px] font-medium uppercase tracking-widest text-neutral-600">
                    Assigned teams
                  </p>
                  <div className="divide-y divide-neutral-800">
                    {mentor.assignedTeams.map((assignment) => (
                      <div
                        key={`${mentor.id}-${assignment.teamId}`}
                        className="flex items-center justify-between gap-4 px-5 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm text-neutral-300">{assignment.teamName}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${TIER_COLORS[assignment.tier]}`}
                          >
                            {MENTOR_TIER_LABELS[assignment.tier]}
                          </span>
                          {assignment.assignedWeeks && assignment.assignedWeeks.length > 0 && (
                            <span className="text-xs text-neutral-600">
                              Wks {assignment.assignedWeeks.join(', ')}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          {assignment.commitmentSigned && (
                            <span className="text-[10px] text-emerald-600">Commitment signed</span>
                          )}
                          <span className="text-xs text-neutral-700">
                            {formatDate(assignment.assignedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mentor.assignedTeams.length === 0 && (
                <div className="border-t border-neutral-800 px-5 py-3">
                  <p className="text-xs text-neutral-700">No team assignments yet.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Unassigned teams note ── */}
      {teams.length > 0 && (
        <div className="mt-8 rounded-lg border border-neutral-800/60 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
            Active teams ({teams.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {teams.map((team) => (
              <span
                key={team.id}
                className="rounded bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400"
              >
                {team.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
