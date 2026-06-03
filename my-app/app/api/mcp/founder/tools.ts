import { createAdminClient } from '@/lib/supabase/accel-admin';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';
import type { AccelProfile } from '@/lib/accel-types';

type ToolContent = Array<{ type: 'text'; text: string }>;

function text(value: unknown): ToolContent {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }];
}

export const FOUNDER_TOOLS = [
  {
    name: 'whoami',
    description: 'Return your name, team, current program week, and what tools are available. Call this first.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_team_status',
    description: 'Get your team name, current program week, and overall submission progress.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_pending_deliverables',
    description: 'List deliverables that are not yet submitted or need revision.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_submission_status',
    description: 'Get the current review status of all your team\'s submissions, including staff feedback.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_curriculum',
    description: 'Get curriculum resources for the current week (or a specific week number).',
    inputSchema: {
      type: 'object',
      properties: {
        week_number: {
          type: 'number',
          description: 'Week number to fetch resources for (defaults to the current unlocked week)',
        },
      },
      required: [],
    },
  },
  {
    name: 'submit_deliverable',
    description: 'Submit a text response for a specific deliverable by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        deliverable_id: {
          type: 'string',
          description: 'UUID of the deliverable (from get_pending_deliverables)',
        },
        text_content: {
          type: 'string',
          description: 'Your written response for this deliverable',
        },
      },
      required: ['deliverable_id', 'text_content'],
    },
  },
  {
    name: 'log_traction',
    description: 'Log a traction metric for your team (users, revenue, LOIs, pilots, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        metric_type: {
          type: 'string',
          enum: ['revenue', 'users', 'lois', 'pilots', 'retention', 'churn', 'other'],
          description: 'Type of metric',
        },
        value: { type: 'number', description: 'Numeric value of the metric' },
        unit: { type: 'string', description: 'Unit (e.g. "users", "USD/mo", "%")' },
        notes: { type: 'string', description: 'Optional context or methodology note' },
        entry_date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (defaults to today)',
        },
      },
      required: ['metric_type', 'value', 'unit'],
    },
  },
  {
    name: 'get_traction_history',
    description: 'Get your team\'s recent traction entries.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

export async function handleFounderToolCall(
  name: string,
  args: Record<string, unknown>,
  profile: AccelProfile
): Promise<ToolContent> {
  const admin = createAdminClient();

  if (name === 'whoami') {
    const [teamResult, weekResult] = await Promise.all([
      profile.team_id
        ? admin.from('accel_teams').select('id, name, venture_stage').eq('id', profile.team_id).single()
        : Promise.resolve({ data: null }),
      admin
        .from('accel_weeks')
        .select('week_number, theme')
        .eq('is_unlocked', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single(),
    ]);
    return text({
      name: profile.full_name,
      role: profile.role,
      team: teamResult.data ?? null,
      current_week: weekResult.data ?? null,
      available_tools: FOUNDER_TOOLS.map((t) => t.name),
    });
  }

  if (name === 'get_team_status') {
    const [teamResult, weekResult] = await Promise.all([
      profile.team_id
        ? admin.from('accel_teams').select('id, name, venture_stage').eq('id', profile.team_id).single()
        : Promise.resolve({ data: null }),
      admin
        .from('accel_weeks')
        .select('week_number, theme')
        .eq('is_unlocked', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single(),
    ]);

    const lines: string[] = [
      `Founder: ${profile.full_name}`,
      `Team: ${teamResult.data?.name ?? 'No team assigned'}`,
      teamResult.data?.venture_stage ? `Stage: ${teamResult.data.venture_stage}` : '',
      weekResult.data
        ? `Current week: Week ${weekResult.data.week_number} — ${weekResult.data.theme}`
        : 'No active week',
    ].filter(Boolean);
    return text(lines.join('\n'));
  }

  if (name === 'get_pending_deliverables') {
    if (!profile.team_id) return text('No team assigned.');

    const [submissionsResult, deliverablesResult] = await Promise.all([
      admin
        .from('accel_submissions')
        .select('deliverable_id, status')
        .eq('team_id', profile.team_id),
      admin
        .from('accel_deliverables')
        .select('id, title, description, expected_format, is_required'),
    ]);

    const submittedIds = new Set(
      (submissionsResult.data ?? [])
        .filter((s) => !['not_started', 'needs_revision'].includes(s.status))
        .map((s) => s.deliverable_id)
    );

    const pending = (deliverablesResult.data ?? []).filter((d) => !submittedIds.has(d.id));
    if (!pending.length) return text('All deliverables submitted!');

    const lines = pending.map(
      (d) =>
        `- [${d.id}] ${d.title} (${d.expected_format}${d.is_required ? ', required' : ''})\n  ${d.description ?? ''}`
    );
    return text(`Pending deliverables:\n${lines.join('\n')}`);
  }

  if (name === 'get_submission_status') {
    if (!profile.team_id) return text('No team assigned.');

    const { data: submissions } = await admin
      .from('accel_submissions')
      .select(`
        id, status, version, submitted_at, review_comments,
        accel_deliverables!accel_submissions_deliverable_id_fkey (title, expected_format)
      `)
      .eq('team_id', profile.team_id)
      .order('submitted_at', { ascending: false });

    if (!submissions?.length) return text('No submissions yet.');
    return text(submissions);
  }

  if (name === 'get_curriculum') {
    const weekNumber = args.week_number as number | undefined;

    let weekId: string | null = null;
    if (weekNumber) {
      const { data: week } = await admin
        .from('accel_weeks')
        .select('id')
        .eq('week_number', weekNumber)
        .single();
      weekId = week?.id ?? null;
    } else {
      const { data: week } = await admin
        .from('accel_weeks')
        .select('id, week_number, theme')
        .eq('is_unlocked', true)
        .order('week_number', { ascending: false })
        .limit(1)
        .single();
      weekId = week?.id ?? null;
    }

    if (!weekId) return text('No curriculum found for the requested week.');

    const { data: items } = await admin
      .from('accel_curriculum_files')
      .select('title, description, file_type, file_url, access_level')
      .eq('program_id', AGGIEX_2026_PROGRAM_ID)
      .eq('week_id', weekId)
      .eq('is_active', true)
      .neq('access_level', 'aggiex_internal')
      .order('uploaded_at');

    if (!items?.length) return text('No curriculum items for this week yet.');
    return text(items);
  }

  if (name === 'submit_deliverable') {
    const { deliverable_id, text_content } = args as { deliverable_id: string; text_content: string };
    if (!profile.team_id) throw new Error('No team assigned.');

    const { data: existing } = await admin
      .from('accel_submissions')
      .select('id, version, status')
      .eq('deliverable_id', deliverable_id)
      .eq('team_id', profile.team_id)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (!existing) {
      await admin.from('accel_submissions').insert({
        deliverable_id,
        team_id: profile.team_id,
        version: 1,
        status: 'submitted',
        text_content,
        submitted_at: new Date().toISOString(),
        submitted_by: profile.id,
      });
    } else {
      const isResubmit = ['approved', 'needs_revision', 'flagged'].includes(existing.status);
      if (isResubmit) {
        await admin.from('accel_submissions').insert({
          deliverable_id,
          team_id: profile.team_id,
          version: existing.version + 1,
          status: 'submitted',
          text_content,
          submitted_at: new Date().toISOString(),
          submitted_by: profile.id,
        });
      } else {
        await admin
          .from('accel_submissions')
          .update({ status: 'submitted', text_content, submitted_at: new Date().toISOString(), submitted_by: profile.id })
          .eq('id', existing.id);
      }
    }

    return text('Deliverable submitted successfully.');
  }

  if (name === 'log_traction') {
    if (!profile.team_id) throw new Error('No team assigned.');
    const { metric_type, value, unit, notes, entry_date } = args as {
      metric_type: string; value: number; unit: string; notes?: string; entry_date?: string;
    };

    await admin.from('accel_traction_entries').insert({
      team_id: profile.team_id,
      metric_type,
      value,
      unit,
      notes: notes ?? '',
      entry_date: entry_date ?? new Date().toISOString().split('T')[0],
      logged_by: profile.id,
    });

    return text(`Logged ${value} ${unit} (${metric_type}).`);
  }

  if (name === 'get_traction_history') {
    if (!profile.team_id) return text('No team assigned.');
    const { data: entries } = await admin
      .from('accel_traction_entries')
      .select('metric_type, value, unit, entry_date, notes')
      .eq('team_id', profile.team_id)
      .order('entry_date', { ascending: false })
      .limit(20);

    if (!entries?.length) return text('No traction entries yet.');
    return text(entries);
  }

  return text(`Unknown tool: ${name}`);
}
