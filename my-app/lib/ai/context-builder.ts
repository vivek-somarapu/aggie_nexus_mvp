/**
 * Builds a role-tailored context string injected into every AI advisor prompt.
 *
 * Keeps tokens lean by using compact prose/markdown, not raw JSON.
 * All queries run in parallel within each role branch.
 */

import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import type { AccelRole } from '@/lib/accel-types';
import { getRedis } from '@/lib/redis';

// ─── Cache config ─────────────────────────────────────────────────────────────

// 5-minute TTL balances data freshness against cold-start latency.
// Accelerator data changes infrequently within a single session window.
const CONTEXT_CACHE_TTL_SECONDS = 300;

/**
 * Returns the cached context string for a given key, or builds it fresh and
 * populates the cache. Degrades silently to live fetches when Redis is absent.
 */
async function withContextCache(
  cacheKey: string,
  buildFn: () => Promise<string>,
): Promise<string> {
  const redis = getRedis();

  if (redis) {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached;
  }

  const context = await buildFn();

  if (redis) {
    await redis.setex(cacheKey, CONTEXT_CACHE_TTL_SECONDS, context);
  }

  return context;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function currency(n: number): string {
  return `$${Number(n).toLocaleString()}`;
}

// ─── Founder context ─────────────────────────────────────────────────────────

async function buildFounderContext(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('full_name, team_id')
    .eq('id', userId)
    .single();

  if (!profile?.team_id) {
    return 'The founder has no team assigned yet.';
  }

  const teamId = profile.team_id;

  const [
    teamResult,
    currentWeekResult,
    allWeeksResult,
    mentorsResult,
    tractionResult,
    meetingsResult,
    upcomingEventsResult,
  ] = await Promise.all([
    supabase.from('accel_teams').select('name, industry_vertical, venture_stage').eq('id', teamId).single(),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme')
      .eq('is_unlocked', true)
      .order('week_number', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('accel_weeks')
      .select('id, week_number, theme, is_unlocked')
      .order('week_number'),

    supabase
      .from('accel_mentor_assignments')
      .select('tier, assigned_weeks, accel_profiles!mentor_id (full_name)')
      .eq('team_id', teamId),

    supabase
      .from('accel_traction_entries')
      .select('metric_type, value, unit, entry_date, notes')
      .eq('team_id', teamId)
      .order('entry_date', { ascending: false })
      .limit(20),

    supabase
      .from('accel_meeting_records')
      .select('meeting_type, meeting_date, duration_minutes, notes, action_items')
      .eq('team_id', teamId)
      .order('meeting_date', { ascending: false })
      .limit(5),

    supabase
      .from('accel_program_events')
      .select('title, event_date, is_mandatory, description')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .in('visible_to', ['all', 'founders'])
      .order('event_date')
      .limit(5),
  ]);

  const team = teamResult.data;
  const currentWeek = currentWeekResult.data;

  // Deliverables + submissions + feedback for ALL unlocked weeks
  let deliverableLines: string[] = [];

  if (allWeeksResult.data) {
    const unlockedWeeks = allWeeksResult.data.filter((w) => w.is_unlocked);

    for (const week of unlockedWeeks) {
      const { data: deliverables } = await supabase
        .from('accel_deliverables')
        .select('id, title, is_required, expected_format')
        .eq('week_id', week.id)
        .order('sort_order');

      if (!deliverables?.length) continue;

      const deliverableIds = deliverables.map((d) => d.id);

      const [submissionsResult, reviewsResult] = await Promise.all([
        supabase
          .from('accel_submissions')
          .select('id, deliverable_id, status, text_content, submitted_at')
          .eq('team_id', teamId)
          .in('deliverable_id', deliverableIds)
          .order('version', { ascending: false }),

        supabase
          .from('accel_reviews')
          .select('submission_id, comments, score')
          .eq('visibility', 'team')
          .order('created_at', { ascending: false }),
      ]);

      const latestByDeliverable = new Map<string, NonNullable<typeof submissionsResult.data>[number]>();
      for (const s of submissionsResult.data ?? []) {
        if (!latestByDeliverable.has(s.deliverable_id)) {
          latestByDeliverable.set(s.deliverable_id, s);
        }
      }

      const feedbackBySubmission = new Map<string, { comments: string; score: number | null }>();
      for (const r of reviewsResult.data ?? []) {
        if (!feedbackBySubmission.has(r.submission_id)) {
          feedbackBySubmission.set(r.submission_id, {
            comments: r.comments ?? '',
            score: r.score,
          });
        }
      }

      deliverableLines.push(`\nWeek ${week.week_number} — ${week.theme}:`);
      for (const d of deliverables) {
        const sub = latestByDeliverable.get(d.id);
        const status = sub?.status ?? 'not_started';
        const required = d.is_required ? ' [required]' : '';
        let line = `  - ${d.title}${required}: ${status}`;

        if (sub && feedbackBySubmission.has(sub.id)) {
          const fb = feedbackBySubmission.get(sub.id)!;
          if (fb.comments) line += `\n    Feedback: "${fb.comments}"`;
          if (fb.score) line += ` (score: ${fb.score}/5)`;
        }
        deliverableLines.push(line);
      }
    }
  }

  // Curriculum for current week
  let curriculumLines: string[] = [];
  if (currentWeek) {
    const { data: curriculum } = await supabase
      .from('accel_curriculum_files')
      .select('title, file_type, description')
      .eq('week_id', currentWeek.id)
      .eq('is_active', true)
      .in('access_level', ['all', 'founders_only']);

    if (curriculum?.length) {
      curriculumLines = curriculum.map((c) => `  - ${c.title} (${c.file_type})${c.description ? `: ${c.description}` : ''}`);
    }
  }

  const lines: string[] = [
    `TEAM: ${team?.name ?? 'Unknown'} | ${team?.industry_vertical ?? ''} | ${team?.venture_stage ?? ''}`,
    `CURRENT USER: ${profile.full_name}`,
    currentWeek ? `CURRENT WEEK: Week ${currentWeek.week_number} — ${currentWeek.theme}` : 'No active week.',
    '',
    '## DELIVERABLES',
    ...deliverableLines,
    '',
  ];

  const mentors = mentorsResult.data ?? [];
  if (mentors.length) {
    lines.push('## MENTORS');
    for (const m of mentors) {
      const name = (m.accel_profiles as { full_name: string } | null)?.full_name ?? 'Unknown';
      const weeks = m.assigned_weeks?.length ? ` (weeks ${m.assigned_weeks.join(', ')})` : '';
      lines.push(`  - ${name} — ${m.tier}${weeks}`);
    }
    lines.push('');
  }

  if (curriculumLines.length) {
    lines.push(`## WEEK ${currentWeek?.week_number ?? '—'} CURRICULUM`);
    lines.push(...curriculumLines);
    lines.push('');
  }

  const traction = tractionResult.data ?? [];
  if (traction.length) {
    lines.push('## RECENT TRACTION (most recent 20 entries)');
    for (const t of traction) {
      lines.push(`  - ${fmtDate(t.entry_date)} ${t.metric_type}: ${t.value} ${t.unit}${t.notes ? ` — "${t.notes}"` : ''}`);
    }
    lines.push('');
  } else {
    lines.push('## TRACTION: No entries logged yet.');
    lines.push('');
  }

  const meetings = meetingsResult.data ?? [];
  if (meetings.length) {
    lines.push('## RECENT MEETINGS');
    for (const m of meetings) {
      const actionItems = (m.action_items as string[] | null)?.join('; ');
      lines.push(`  - ${fmtDate(m.meeting_date)} ${m.meeting_type}${m.duration_minutes ? ` (${m.duration_minutes}m)` : ''}`);
      if (m.notes) lines.push(`    Notes: ${m.notes}`);
      if (actionItems) lines.push(`    Action items: ${actionItems}`);
    }
    lines.push('');
  }

  const events = upcomingEventsResult.data ?? [];
  if (events.length) {
    lines.push('## UPCOMING EVENTS');
    for (const e of events) {
      lines.push(`  - ${fmtDate(e.event_date)} ${e.title}${e.is_mandatory ? ' [mandatory]' : ''}`);
    }
  }

  return lines.join('\n');
}

// ─── AggieX team / MCE staff context ─────────────────────────────────────────

async function buildAdminContext(): Promise<string> {
  const supabase = await createClient();

  const [teamsResult, currentWeekResult, tractionResult, mentorsResult, fundingEventsResult] =
    await Promise.all([
      supabase
        .from('accel_teams')
        .select('id, name, industry_vertical, venture_stage, crucible_outcome, accel_milestone_funding (funding_status, amount_unlocked, total_award)')
        .eq('is_active', true)
        .order('name'),

      supabase
        .from('accel_weeks')
        .select('id, week_number, theme')
        .eq('is_unlocked', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single(),

      supabase
        .from('accel_traction_entries')
        .select('team_id, metric_type, value, unit, entry_date, accel_teams (name)')
        .order('entry_date', { ascending: false })
        .limit(100),

      supabase
        .from('accel_profiles')
        .select('full_name, accel_mentor_assignments (team_id, tier, accel_teams (name))')
        .eq('role', 'mentor')
        .eq('is_active', true)
        .order('full_name'),

      supabase
        .from('accel_funding_events')
        .select('team_id, fund_type, amount, source, acquired_at, accel_teams (name)')
        .eq('program_id', AGGIEX_2026_PROGRAM_ID)
        .order('acquired_at', { ascending: false })
        .limit(50),
    ]);

  const teams = teamsResult.data ?? [];
  const currentWeek = currentWeekResult.data;

  // Submission summary per team for current week
  let submissionSummary = new Map<string, { submitted: number; total: number; flagged: boolean; needsRevision: number }>();

  if (currentWeek) {
    const { data: deliverables } = await supabase
      .from('accel_deliverables')
      .select('id')
      .eq('week_id', currentWeek.id);

    const deliverableIds = deliverables?.map((d) => d.id) ?? [];

    if (deliverableIds.length) {
      const { data: submissions } = await supabase
        .from('accel_submissions')
        .select('team_id, status')
        .in('deliverable_id', deliverableIds);

      for (const team of teams) {
        const teamSubs = submissions?.filter((s) => s.team_id === team.id) ?? [];
        submissionSummary.set(team.id, {
          submitted: teamSubs.filter((s) => ['submitted', 'under_review', 'approved'].includes(s.status)).length,
          total: deliverableIds.length,
          flagged: teamSubs.some((s) => s.status === 'flagged'),
          needsRevision: teamSubs.filter((s) => s.status === 'needs_revision').length,
        });
      }
    }
  }

  // Latest traction per metric per team
  const latestTraction = new Map<string, string>();
  for (const entry of tractionResult.data ?? []) {
    const teamName = (entry.accel_teams as { name: string } | null)?.name ?? 'Unknown';
    const key = `${teamName}:${entry.metric_type}`;
    if (!latestTraction.has(key)) {
      latestTraction.set(key, `${entry.value} ${entry.unit} on ${fmtDate(entry.entry_date)}`);
    }
  }

  const lines: string[] = [
    `PROGRAM: AggieX Summer 2026`,
    currentWeek ? `CURRENT WEEK: Week ${currentWeek.week_number} — ${currentWeek.theme}` : 'No active week.',
    `TEAMS: ${teams.length} active`,
    '',
    '## TEAM SNAPSHOT',
  ];

  for (const team of teams) {
    const funding = team.accel_milestone_funding?.[0];
    const subs = submissionSummary.get(team.id);
    const fundingStr = funding
      ? `${funding.funding_status} (${currency(funding.amount_unlocked)}/${currency(funding.total_award)} unlocked)`
      : 'no funding record';
    const subStr = subs
      ? `${subs.submitted}/${subs.total} submitted${subs.flagged ? ' ⚑FLAGGED' : ''}${subs.needsRevision > 0 ? ` (${subs.needsRevision} needs revision)` : ''}`
      : 'no submissions yet';
    const crucible = team.crucible_outcome ? ` | crucible: ${team.crucible_outcome}` : '';

    lines.push(`\n### ${team.name} (${team.industry_vertical ?? 'no vertical'})`);
    lines.push(`  Week ${currentWeek?.week_number ?? '—'} deliverables: ${subStr}`);
    lines.push(`  Funding: ${fundingStr}${crucible}`);

    // Traction for this team
    const teamTractionKeys = Array.from(latestTraction.keys()).filter((k) => k.startsWith(`${team.name}:`));
    if (teamTractionKeys.length) {
      lines.push(`  Latest traction:`);
      for (const k of teamTractionKeys) {
        const metric = k.split(':')[1];
        lines.push(`    - ${metric}: ${latestTraction.get(k)}`);
      }
    } else {
      lines.push(`  Traction: no entries logged`);
    }
  }

  lines.push('');

  // External funding events
  const fundingEvents = fundingEventsResult.data ?? [];
  if (fundingEvents.length) {
    lines.push('## EXTERNAL FUNDING EVENTS');
    for (const e of fundingEvents) {
      const teamName = (e.accel_teams as { name: string } | null)?.name ?? 'Unknown';
      lines.push(`  - ${teamName}: ${e.fund_type} ${currency(Number(e.amount))} from ${e.source} on ${fmtDate(e.acquired_at)}`);
    }
    lines.push('');
  }

  // Mentor assignments
  const mentors = mentorsResult.data ?? [];
  if (mentors.length) {
    lines.push('## MENTORS');
    for (const m of mentors) {
      const assignments = (m.accel_mentor_assignments as Array<{ tier: string; accel_teams: { name: string } | null }>) ?? [];
      const teams = assignments.map((a) => `${a.accel_teams?.name ?? '?'} (${a.tier})`).join(', ');
      lines.push(`  - ${m.full_name}: ${teams || 'unassigned'}`);
    }
  }

  return lines.join('\n');
}

// ─── Mentor context ───────────────────────────────────────────────────────────

async function buildMentorContext(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const { data: assignments } = await supabase
    .from('accel_mentor_assignments')
    .select('team_id, tier, assigned_weeks, accel_teams (id, name)')
    .eq('mentor_id', userId);

  const assignedTeamIds = (assignments ?? []).map((a) => a.team_id);

  const [tractionResult, meetingsResult, eventsResult] = await Promise.all([
    assignedTeamIds.length
      ? supabase
          .from('accel_traction_entries')
          .select('team_id, metric_type, value, unit, entry_date, accel_teams (name)')
          .in('team_id', assignedTeamIds)
          .order('entry_date', { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),

    assignedTeamIds.length
      ? supabase
          .from('accel_meeting_records')
          .select('team_id, meeting_type, meeting_date, notes, accel_teams (name)')
          .in('team_id', assignedTeamIds)
          .order('meeting_date', { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),

    supabase
      .from('accel_program_events')
      .select('title, event_date, is_mandatory')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .in('visible_to', ['all', 'mentors'])
      .order('event_date')
      .limit(5),
  ]);

  const lines: string[] = [
    `MENTOR: ${profile?.full_name ?? 'Unknown'}`,
    '',
    '## ASSIGNED TEAMS',
  ];

  for (const assignment of assignments ?? []) {
    const teamName = (assignment.accel_teams as { name: string } | null)?.name ?? 'Unknown';
    const weeks = assignment.assigned_weeks?.length
      ? ` (assigned weeks: ${assignment.assigned_weeks.join(', ')})`
      : '';
    lines.push(`  - ${teamName} — ${assignment.tier}${weeks}`);
  }

  const traction = tractionResult.data ?? [];
  if (traction.length) {
    lines.push('', '## TEAM TRACTION (latest)');
    const latest = new Map<string, string>();
    for (const t of traction) {
      const teamName = (t.accel_teams as { name: string } | null)?.name ?? 'Unknown';
      const key = `${teamName}:${t.metric_type}`;
      if (!latest.has(key)) {
        latest.set(key, `${teamName} ${t.metric_type}: ${t.value} ${t.unit} (${fmtDate(t.entry_date)})`);
      }
    }
    lines.push(...Array.from(latest.values()).map((v) => `  - ${v}`));
  }

  const meetings = meetingsResult.data ?? [];
  if (meetings.length) {
    lines.push('', '## RECENT MEETINGS WITH TEAMS');
    for (const m of meetings) {
      const teamName = (m.accel_teams as { name: string } | null)?.name ?? 'Unknown';
      lines.push(`  - ${fmtDate(m.meeting_date)} with ${teamName} (${m.meeting_type})${m.notes ? `: ${m.notes}` : ''}`);
    }
  }

  const events = eventsResult.data ?? [];
  if (events.length) {
    lines.push('', '## UPCOMING EVENTS');
    for (const e of events) {
      lines.push(`  - ${fmtDate(e.event_date)} ${e.title}${e.is_mandatory ? ' [mandatory]' : ''}`);
    }
  }

  return lines.join('\n');
}

// ─── System prompt builder ────────────────────────────────────────────────────

const ROLE_PREAMBLES: Record<AccelRole, string> = {
  founder:
    'You are an AI advisor for a startup team in the AggieX Summer 2026 accelerator. ' +
    'You have access to their real-time program data below. Help them understand what to submit next, ' +
    'interpret feedback from the AggieX team, explain curriculum concepts, track their traction, ' +
    'and prepare for upcoming events and mentor meetings. Be direct, specific, and actionable. ' +
    'Keep responses concise — founders are busy.',

  aggiex_team:
    'You are the AI co-founder of AggieX — the Aggie Experienced Innovators Accelerator at UC Davis. ' +
    'You have full visibility into every team in the cohort: their submissions, traction data, ' +
    'meeting notes, mentor assignments, funding status, and all uploaded knowledge base documents.\n\n' +

    'Your job is not to summarize — it is to analyze, predict, and advise with conviction. ' +
    'Be direct and opinionated. Name specific teams. Use data from the program context. ' +
    'Hedge only when data is genuinely insufficient.\n\n' +

    'CORE CAPABILITIES:\n\n' +

    '1. TEAM SUCCESS PREDICTION\n' +
    'Based on submission quality trends, traction momentum, mentor engagement frequency, ' +
    'and cohort-wide norms — predict which teams are on a success trajectory and which are at risk. ' +
    'Compare teams to each other when relevant. If a team is at risk of disqualification from funding, say so.\n\n' +

    '2. SUBMISSION QUALITY SCORING (1–5 rubric)\n' +
    '  1 = Missing or unusable — no meaningful content\n' +
    '  2 = Weak — present but vague, lacks specifics, minimal effort\n' +
    '  3 = Acceptable — meets baseline requirements, some gaps\n' +
    '  4 = Strong — clear, specific, demonstrates founder understanding\n' +
    '  5 = Exceptional — investor-grade, deep insight, supported by traction data\n' +
    'When asked about a submission, assign a score and explain why with specific evidence.\n\n' +

    '3. INVESTMENT POTENTIAL PREDICTION\n' +
    'For any team, assess investment potential across these signals:\n' +
    '  - Founder-market fit: do their submissions show lived expertise in the problem?\n' +
    '  - Traction velocity: growth rate and consistency, not absolute numbers\n' +
    '  - Market timing: is the vertical mature enough? Too early or too late?\n' +
    '  - Engagement quality: meeting attendance, action item follow-through, mentor utilization\n' +
    '  - Submission trajectory: improving over weeks, declining, or flatlined?\n' +
    'Give a direct verdict: HIGH / MEDIUM / LOW potential, with 2–3 supporting data points.\n\n' +

    'When you receive SEMANTICALLY RELEVANT CONTENT in the system prompt, treat it as ' +
    'primary evidence — quote specific phrases to support your analysis.',

  mce_staff:
    'You are an AI advisor for MCE staff observing the AggieX Summer 2026 cohort. ' +
    'You have access to cohort-level data. Help them understand overall program health, ' +
    'team progress, and key metrics. Read-only observer perspective — no management actions.',

  mentor:
    'You are an AI advisor for a mentor in the AggieX Summer 2026 accelerator. ' +
    'You have data on your assigned teams. Help prepare for mentor sessions, review team progress, ' +
    'and give context-aware advice for your next meetings.',
};

export async function buildSystemPrompt(userId: string, role: AccelRole): Promise<string> {
  const preamble = ROLE_PREAMBLES[role];

  // Admin context is identical for every aggiex/mce user — share one cache entry.
  // Founder and mentor context is personal — scope the key by userId.
  const isAdminRole = role === 'aggiex_team' || role === 'mce_staff';
  const cacheKey = isAdminRole
    ? `accel:ctx:admin`
    : `accel:ctx:${role}:${userId}`;

  const context = await withContextCache(cacheKey, () => {
    if (role === 'founder') return buildFounderContext(userId);
    if (isAdminRole) return buildAdminContext();
    return buildMentorContext(userId);
  });

  // Today's date is composed outside the cache so it is always accurate.
  return `${preamble}\n\nToday's date: ${format(new Date(), 'MMMM d, yyyy')}.\n\n---\nPROGRAM DATA (live, pulled from database):\n${context}\n---`;
}

// ─── Semantic context ─────────────────────────────────────────────────────────

// Retrieve more candidates than needed so the reranker has a rich pool to work with.
const HYBRID_CANDIDATE_COUNT = 15;
const RERANKED_TOP_N = 5;

type HybridMatch = {
  source_table: string;
  source_id: string;
  chunk_index: number;
  chunk_text: string;
  rrf_score: number;
};

/**
 * Retrieves semantically relevant chunks for the user's query using a
 * hybrid BM25 + vector search (Reciprocal Rank Fusion), then reranks
 * the top candidates with the Jina cross-encoder to maximize precision.
 *
 * Returns a formatted block ready to append to the system prompt, or an
 * empty string if Jina is unconfigured, the query is empty, or nothing matches.
 */
export async function buildSemanticContext(query: string): Promise<string> {
  if (!query.trim()) return '';
  if (!process.env.JINA_API_KEY) return '';

  // Dynamic imports keep these modules off paths that never use them.
  const { embedText } = await import('@/lib/ai/embedder');
  const { rerankChunks } = await import('@/lib/ai/reranker');
  const supabase = await createClient();

  let queryVector: number[];
  try {
    queryVector = await embedText(query);
  } catch (error) {
    console.error('[buildSemanticContext] Failed to embed query:', error);
    return '';
  }

  const { data: matches, error: rpcError } = await supabase.rpc('match_embeddings_hybrid', {
    query_embedding: queryVector,
    query_text: query,
    match_count: HYBRID_CANDIDATE_COUNT,
  });

  if (rpcError) {
    console.error('[buildSemanticContext] match_embeddings_hybrid RPC failed:', rpcError);
    return '';
  }

  const candidates = (matches ?? []) as HybridMatch[];
  if (candidates.length === 0) return '';

  const candidateTexts = candidates.map((c) => c.chunk_text);

  let topIndices: number[];
  try {
    topIndices = await rerankChunks(query, candidateTexts, RERANKED_TOP_N);
  } catch (error) {
    console.error('[buildSemanticContext] Reranking failed, falling back to RRF order:', error);
    topIndices = candidates.slice(0, RERANKED_TOP_N).map((_, i) => i);
  }

  const topChunks = topIndices.map((i) => candidates[i]).filter(Boolean);
  if (topChunks.length === 0) return '';

  const lines = [
    '## SEMANTICALLY RELEVANT CONTENT (matched to your query)',
    ...topChunks.map((chunk) => `  [${chunk.source_table}] ${chunk.chunk_text}`),
  ];

  return lines.join('\n');
}
