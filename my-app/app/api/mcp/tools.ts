import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import type { AccelProfile } from '@/lib/accel-types';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

type ToolContent = Array<{ type: 'text'; text: string }>;

function text(value: unknown): ToolContent {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }];
}

// ─── Tool definitions ────────────────────────────────────────────────────────

export const STAFF_TOOLS = [
  {
    name: 'get_program_overview',
    description:
      'Get the full AggieX program context: all weeks with themes, lock status, team list, and current active week.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_all_teams_status',
    description:
      'Get submission progress for every team in the current (or a specified) week. ' +
      'Returns counts of submitted, pending, and flagged deliverables per team.',
    inputSchema: {
      type: 'object',
      properties: {
        week_number: {
          type: 'number',
          description: 'Week number to query (defaults to the current unlocked week)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_team_detail',
    description: 'Get full context for a specific team: founders, submission history, and recent traction.',
    inputSchema: {
      type: 'object',
      properties: {
        team_name: { type: 'string', description: 'Team name (partial match supported)' },
      },
      required: ['team_name'],
    },
  },
  {
    name: 'process_meeting_notes',
    description:
      'Analyze a photo or screenshot of meeting notes using AI vision. ' +
      'Returns a structured summary with key decisions, action items per team, ' +
      'and suggested deliverables to add. Provide a publicly accessible image URL.',
    inputSchema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'Publicly accessible URL of the meeting notes image (JPEG, PNG, WEBP)',
        },
        context: {
          type: 'string',
          description: 'Optional: brief context about the meeting (e.g. "Week 3 check-in", "Demo Day prep")',
        },
      },
      required: ['image_url'],
    },
  },
  {
    name: 'add_deliverable',
    description:
      'Create a new deliverable for a program week. ' +
      'Leave assigned_team_ids null to assign to all teams, or pass specific team UUIDs.',
    inputSchema: {
      type: 'object',
      properties: {
        week_id: { type: 'string', description: 'UUID of the program week' },
        title: { type: 'string', description: 'Deliverable title (max 300 chars)' },
        description: { type: 'string', description: 'What founders need to submit' },
        expected_format: {
          type: 'string',
          enum: ['text', 'file', 'link', 'any'],
          description: 'Expected submission format',
        },
        is_required: { type: 'boolean', description: 'Whether this is required (default true)' },
        assigned_team_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific team UUIDs to assign, or omit/null for all teams',
          nullable: true,
        },
      },
      required: ['week_id', 'title', 'expected_format'],
    },
  },
  {
    name: 'update_submission_status',
    description:
      "Update a team's submission status. Use this to approve, flag, or request revision on a submitted deliverable.",
    inputSchema: {
      type: 'object',
      properties: {
        submission_id: { type: 'string', description: 'UUID of the submission' },
        status: {
          type: 'string',
          enum: ['approved', 'needs_revision', 'flagged', 'under_review'],
          description: 'New status',
        },
        comments: { type: 'string', description: 'Optional feedback for the team' },
      },
      required: ['submission_id', 'status'],
    },
  },
  {
    name: 'unlock_week',
    description: 'Unlock a program week so founders can see its deliverables and curriculum.',
    inputSchema: {
      type: 'object',
      properties: {
        week_id: { type: 'string', description: 'UUID of the week to unlock' },
      },
      required: ['week_id'],
    },
  },
  {
    name: 'create_curriculum_item',
    description: 'Add a curriculum file or resource to a program week.',
    inputSchema: {
      type: 'object',
      properties: {
        week_id: { type: 'string', description: 'UUID of the week (or omit for program-wide)' },
        title: { type: 'string', description: 'Resource title' },
        description: { type: 'string', description: 'Brief description of the resource' },
        file_url: { type: 'string', description: 'URL of the file or external link' },
        file_type: {
          type: 'string',
          enum: ['pdf', 'docx', 'video_link', 'external_link', 'other'],
          description: 'Type of the resource',
        },
        access_level: {
          type: 'string',
          enum: ['all', 'founders_only', 'aggiex_internal'],
          description: 'Who can see this resource (default: founders_only)',
        },
      },
      required: ['title', 'file_url', 'file_type'],
    },
  },
  {
    name: 'add_internal_doc',
    description:
      'Add an internal document visible only to AggieX/MCE staff. ' +
      'Use for SOPs, meeting recaps, internal notes, or any file not meant for founders.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title (max 200 chars)' },
        description: { type: 'string', description: 'Brief description of the document (max 1000 chars)' },
        file_url: { type: 'string', description: 'URL of the file or external link' },
        file_type: {
          type: 'string',
          enum: ['pdf', 'docx', 'link', 'other'],
          description: 'Type of the document',
        },
        visibility: {
          type: 'string',
          enum: ['aggiex_only', 'aggiex_mce'],
          description: 'aggiex_only = AggieX team only; aggiex_mce = AggieX + MCE staff (default)',
        },
      },
      required: ['title', 'file_url', 'file_type'],
    },
  },
];

// ─── Tool implementations ────────────────────────────────────────────────────

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  profile: AccelProfile
): Promise<ToolContent> {
  const admin = createAdminClient();

  if (name === 'get_program_overview') {
    const [weeksResult, teamsResult] = await Promise.all([
      admin
        .from('accel_weeks')
        .select('id, week_number, theme, is_unlocked, start_date, end_date')
        .order('week_number'),
      admin.from('accel_teams').select('id, name, is_active').eq('is_active', true),
    ]);
    return text({
      weeks: weeksResult.data ?? [],
      teams: teamsResult.data ?? [],
      current_week:
        (weeksResult.data ?? []).filter((w) => w.is_unlocked).at(-1) ?? null,
    });
  }

  if (name === 'get_all_teams_status') {
    const weekNumber = args.week_number as number | undefined;

    let weekQuery = admin.from('accel_weeks').select('id, week_number, theme').eq('is_unlocked', true);
    if (weekNumber) weekQuery = weekQuery.eq('week_number', weekNumber);
    const { data: weeks } = await weekQuery.order('week_number', { ascending: false }).limit(1);
    const week = weeks?.[0];
    if (!week) return text('No unlocked weeks found.');

    const { data: deliverables } = await admin
      .from('accel_deliverables')
      .select('id, title, is_required')
      .eq('week_id', week.id);

    const { data: submissions } = await admin
      .from('accel_submissions')
      .select('team_id, deliverable_id, status')
      .in('deliverable_id', (deliverables ?? []).map((d) => d.id));

    const { data: teams } = await admin
      .from('accel_teams')
      .select('id, name')
      .eq('is_active', true);

    const statusByTeam = (teams ?? []).map((team) => {
      const teamSubs = (submissions ?? []).filter((s) => s.team_id === team.id);
      const submitted = teamSubs.filter((s) =>
        ['submitted', 'under_review', 'approved'].includes(s.status)
      ).length;
      const flagged = teamSubs.filter((s) => s.status === 'flagged').length;
      const total = (deliverables ?? []).length;
      return { team: team.name, submitted, flagged, total, pending: total - submitted };
    });

    return text({ week: `Week ${week.week_number} — ${week.theme}`, teams: statusByTeam });
  }

  if (name === 'get_team_detail') {
    const teamName = args.team_name as string;
    const { data: teams } = await admin
      .from('accel_teams')
      .select('id, name, venture_stage, industry_vertical, website')
      .ilike('name', `%${teamName}%`)
      .limit(1);

    const team = teams?.[0];
    if (!team) return text(`No team found matching "${teamName}".`);

    const [profilesResult, tractionResult, submissionsResult] = await Promise.all([
      admin
        .from('accel_profiles')
        .select('full_name, email, role')
        .eq('team_id', team.id),
      admin
        .from('accel_traction_entries')
        .select('metric_type, value, unit, entry_date, notes')
        .eq('team_id', team.id)
        .order('entry_date', { ascending: false })
        .limit(10),
      admin
        .from('accel_submissions')
        .select('deliverable_id, status, version, submitted_at')
        .eq('team_id', team.id)
        .order('submitted_at', { ascending: false })
        .limit(20),
    ]);

    return text({
      team,
      members: profilesResult.data ?? [],
      recent_traction: tractionResult.data ?? [],
      recent_submissions: submissionsResult.data ?? [],
    });
  }

  if (name === 'process_meeting_notes') {
    const imageUrl = args.image_url as string;
    const context = (args.context as string | undefined) ?? '';

    const { text: extracted } = await generateText({
      model: groq('llama-3.2-90b-vision-preview'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: new URL(imageUrl) },
            {
              type: 'text',
              text: [
                context ? `Meeting context: ${context}` : '',
                'You are analyzing meeting notes for the AggieX startup accelerator.',
                'Extract and structure the following from the image:',
                '1. Meeting summary (2-3 sentences)',
                '2. Key decisions made',
                '3. Action items — list each with: owner (team name or person), action, deadline if visible',
                '4. Suggested deliverables to add to the platform (title, description, format: text/file/link)',
                '5. Any traction metrics mentioned (metric, value, team)',
                'Be concise and precise. If something is illegible, note it.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        },
      ],
    });

    return text(extracted);
  }

  if (name === 'add_deliverable') {
    const { data, error } = await admin
      .from('accel_deliverables')
      .insert({
        week_id: args.week_id as string,
        title: args.title as string,
        description: (args.description as string) ?? null,
        expected_format: (args.expected_format as string) ?? 'any',
        is_required: (args.is_required as boolean) ?? true,
        sort_order: 0,
        assigned_team_ids: (args.assigned_team_ids as string[] | null) ?? null,
      })
      .select('id, title, week_id')
      .single();

    if (error) throw new Error(error.message);
    return text(`Deliverable created: "${data.title}" (${data.id})`);
  }

  if (name === 'update_submission_status') {
    const updates: Record<string, unknown> = {
      status: args.status,
      updated_at: new Date().toISOString(),
    };
    if (args.comments) updates.review_comments = args.comments;

    const { error } = await admin
      .from('accel_submissions')
      .update(updates)
      .eq('id', args.submission_id as string);

    if (error) throw new Error(error.message);
    return text(`Submission ${args.submission_id} updated to "${args.status}".`);
  }

  if (name === 'unlock_week') {
    const { error } = await admin
      .from('accel_weeks')
      .update({
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
        unlocked_by: profile.id,
      })
      .eq('id', args.week_id as string);

    if (error) throw new Error(error.message);
    return text(`Week ${args.week_id} unlocked.`);
  }

  if (name === 'create_curriculum_item') {
    const { data, error } = await admin
      .from('accel_curriculum_files')
      .insert({
        week_id: (args.week_id as string) ?? null,
        program_id: (await admin.from('accel_programs').select('id').eq('is_active', true).single()).data?.id,
        uploader_id: profile.id,
        title: args.title as string,
        description: (args.description as string) ?? null,
        file_url: args.file_url as string,
        file_type: args.file_type as string,
        access_level: (args.access_level as string) ?? 'founders_only',
        is_active: true,
      })
      .select('id, title')
      .single();

    if (error) throw new Error(error.message);
    return text(`Curriculum item created: "${data.title}" (${data.id})`);
  }

  if (name === 'add_internal_doc') {
    const { data, error } = await admin
      .from('accel_internal_docs')
      .insert({
        title: args.title as string,
        description: (args.description as string) ?? null,
        file_url: args.file_url as string,
        file_type: args.file_type as string,
        visibility: (args.visibility as string) ?? 'aggiex_mce',
        program_id: (await admin.from('accel_programs').select('id').eq('is_active', true).single()).data?.id,
        uploader_id: profile.id,
      })
      .select('id, title')
      .single();

    if (error) throw new Error(error.message);
    return text(`Internal doc created: "${data.title}" (${data.id})`);
  }

  return text(`Unknown tool: ${name}`);
}
