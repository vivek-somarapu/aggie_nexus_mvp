import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccelRole, AccelWeek, AccelTeam } from '@/lib/accel-types';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import UploadCurriculumForm from './components/upload-curriculum-form';
import CurriculumFileCard, { type CurriculumFileData } from './components/curriculum-file-card';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeekGroup {
  weekNumber: number | null; // null = program-wide
  theme: string | null;
  files: CurriculumFileData[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function groupFilesByWeek(files: CurriculumFileData[]): WeekGroup[] {
  const programWide: CurriculumFileData[] = [];
  const byWeek = new Map<number, CurriculumFileData[]>();

  for (const file of files) {
    if (!file.accel_weeks) {
      programWide.push(file);
      continue;
    }
    const weekNumber = file.accel_weeks.week_number;
    const existing = byWeek.get(weekNumber) ?? [];
    existing.push(file);
    byWeek.set(weekNumber, existing);
  }

  const groups: WeekGroup[] = [];

  if (programWide.length > 0) {
    groups.push({ weekNumber: null, theme: null, files: programWide });
  }

  const sortedWeekNumbers = Array.from(byWeek.keys()).sort((a, b) => a - b);
  for (const weekNumber of sortedWeekNumbers) {
    const weekFiles = byWeek.get(weekNumber) ?? [];
    const theme = weekFiles[0]?.accel_weeks?.theme ?? null;
    groups.push({ weekNumber, theme, files: weekFiles });
  }

  return groups;
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchCurriculumData(role: AccelRole) {
  const supabase = await createClient();

  const { data: files, error } = await supabase
    .from('accel_curriculum_files')
    .select(`
      id, week_id, title, description,
      file_type, file_url, access_level, assigned_team_ids, is_active, uploaded_at,
      accel_weeks (week_number, theme)
    `)
    .eq('program_id', AGGIEX_2026_PROGRAM_ID)
    .order('uploaded_at', { ascending: true });

  if (error) throw new Error(error.message);

  let allWeeks: Pick<AccelWeek, 'id' | 'week_number' | 'theme'>[] = [];
  let allTeams: Pick<AccelTeam, 'id' | 'name'>[] = [];

  if (role === 'aggiex_team' || role === 'mce_staff') {
    const [weeksResult, teamsResult] = await Promise.all([
      supabase
        .from('accel_weeks')
        .select('id, week_number, theme')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .order('week_number'),
      supabase
        .from('accel_teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
    ]);
    allWeeks = weeksResult.data ?? [];
    allTeams = teamsResult.data ?? [];
  }

  return {
    files: (files ?? []) as CurriculumFileData[],
    allWeeks,
    allTeams,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CurriculumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/accelerator/access-denied');

  const role = profile.role as AccelRole;
  const { files, allWeeks, allTeams } = await fetchCurriculumData(role);

  const isAdmin = role === 'aggiex_team' || role === 'mce_staff';
  const canDelete = role === 'aggiex_team';

  // Admins see all files (active + inactive); RLS also enforces this at the DB level for others
  const visibleFiles = isAdmin ? files : files.filter((f) => f.is_active);
  const groups = groupFilesByWeek(visibleFiles);
  const totalFiles = visibleFiles.length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Program</p>
          <h1 className="mt-1 text-xl font-semibold text-neutral-100">Curriculum</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {totalFiles === 0
              ? 'No resources published yet.'
              : `${totalFiles} resource${totalFiles !== 1 ? 's' : ''} across ${groups.length} section${groups.length !== 1 ? 's' : ''}.`}
          </p>
        </div>

        {isAdmin && <UploadCurriculumForm weeks={allWeeks} teams={allTeams} />}
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="rounded-lg border border-neutral-800 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">
            {isAdmin
              ? 'No resources yet. Add the first one with the button above.'
              : 'No curriculum resources have been published yet.'}
          </p>
        </div>
      )}

      {/* Grouped file list */}
      <div className="flex flex-col gap-8">
        {groups.map((group) => {
          const groupKey = group.weekNumber ?? 'program-wide';

          return (
            <section key={groupKey}>
              <div className="mb-3 flex items-center gap-2 border-b border-neutral-800 pb-2">
                <h2 className="text-sm font-semibold text-neutral-200">
                  {group.weekNumber === null ? 'Program Resources' : `Week ${group.weekNumber}`}
                </h2>
                {group.theme && (
                  <span className="text-sm font-normal text-neutral-500">
                    — {group.theme}
                  </span>
                )}
                <span className="ml-auto text-xs text-neutral-600">
                  {group.files.length} file{group.files.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.files.map((file) => (
                  <CurriculumFileCard
                    key={file.id}
                    file={file}
                    isAdmin={isAdmin}
                    canDelete={canDelete}
                    allWeeks={allWeeks}
                    allTeams={allTeams}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
