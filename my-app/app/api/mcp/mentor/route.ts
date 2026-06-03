import { NextRequest, NextResponse } from 'next/server';
import { requireAccelAuth } from '@/lib/accel-auth';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import type { AccelProfile } from '@/lib/accel-types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SERVER_INFO = {
  name: 'aggiex-mentor',
  version: '1.0.0',
  instructions:
    'Read-only AggieX mentor tools. Start with whoami, then get_team_progress to review your mentees. ' +
    'All tools are read-only — mentors cannot write to the platform via this server.',
};

const MENTOR_TOOLS = [
  {
    name: 'whoami',
    description: 'Return your name, role, and available tools.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_program_overview',
    description: 'Get all program weeks with themes and lock status, plus all active teams.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_team_progress',
    description: 'Get detailed progress for a specific team: submissions, traction, and founders.',
    inputSchema: {
      type: 'object',
      properties: {
        team_name: { type: 'string', description: 'Team name (partial match supported)' },
      },
      required: ['team_name'],
    },
  },
  {
    name: 'get_all_teams_status',
    description: 'Get submission progress for all teams in the current (or specified) week.',
    inputSchema: {
      type: 'object',
      properties: {
        week_number: { type: 'number', description: 'Week number to query (defaults to current)' },
      },
      required: [],
    },
  },
];

type ToolContent = Array<{ type: 'text'; text: string }>;
function text(value: unknown): ToolContent {
  return [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }];
}

async function handleMentorToolCall(
  name: string,
  args: Record<string, unknown>,
  profile: AccelProfile
): Promise<ToolContent> {
  const admin = createAdminClient();

  if (name === 'whoami') {
    return text({
      name: profile.full_name,
      role: profile.role,
      available_tools: MENTOR_TOOLS.map((t) => t.name),
      note: 'Read-only access. Mentors cannot write to the platform via MCP.',
    });
  }

  if (name === 'get_program_overview') {
    const [weeksResult, teamsResult] = await Promise.all([
      admin.from('accel_weeks').select('week_number, theme, is_unlocked, start_date, end_date').order('week_number'),
      admin.from('accel_teams').select('id, name, venture_stage, is_active').eq('is_active', true),
    ]);
    return text({
      weeks: weeksResult.data ?? [],
      teams: teamsResult.data ?? [],
      current_week: (weeksResult.data ?? []).filter((w) => w.is_unlocked).at(-1) ?? null,
    });
  }

  if (name === 'get_team_progress') {
    const teamName = args.team_name as string;
    const { data: teams } = await admin
      .from('accel_teams')
      .select('id, name, venture_stage, industry_vertical, website')
      .ilike('name', `%${teamName}%`)
      .limit(1);

    const team = teams?.[0];
    if (!team) return text(`No team found matching "${teamName}".`);

    const [membersResult, tractionResult, submissionsResult] = await Promise.all([
      admin.from('accel_profiles').select('full_name, email, role').eq('team_id', team.id),
      admin
        .from('accel_traction_entries')
        .select('metric_type, value, unit, entry_date, notes')
        .eq('team_id', team.id)
        .order('entry_date', { ascending: false })
        .limit(15),
      admin
        .from('accel_submissions')
        .select(`
          status, version, submitted_at,
          accel_deliverables!accel_submissions_deliverable_id_fkey (title, expected_format)
        `)
        .eq('team_id', team.id)
        .order('submitted_at', { ascending: false })
        .limit(20),
    ]);

    return text({
      team,
      members: membersResult.data ?? [],
      recent_traction: tractionResult.data ?? [],
      recent_submissions: submissionsResult.data ?? [],
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
      .from('accel_deliverables').select('id').eq('week_id', week.id);
    const { data: submissions } = await admin
      .from('accel_submissions')
      .select('team_id, status')
      .in('deliverable_id', (deliverables ?? []).map((d) => d.id));
    const { data: teams } = await admin
      .from('accel_teams').select('id, name').eq('is_active', true);

    const statusByTeam = (teams ?? []).map((team) => {
      const teamSubs = (submissions ?? []).filter((s) => s.team_id === team.id);
      const submitted = teamSubs.filter((s) => ['submitted', 'under_review', 'approved'].includes(s.status)).length;
      const total = (deliverables ?? []).length;
      return { team: team.name, submitted, total, pending: total - submitted };
    });

    return text({ week: `Week ${week.week_number} — ${week.theme}`, teams: statusByTeam });
  }

  return text(`Unknown tool: ${name}`);
}

interface McpMessage {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
}

function ok(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result });
}

function mcpError(id: string | number | null | undefined, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

export async function POST(request: NextRequest) {
  const { profile, error: authError } = await requireAccelAuth(request, ['mentor', 'aggiex_team', 'mce_staff']);
  if (authError) return authError;

  let body: McpMessage;
  try {
    body = await request.json() as McpMessage;
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { method, params, id } = body;

  if (id === undefined && method.startsWith('notifications/')) {
    return new NextResponse(null, { status: 202 });
  }

  switch (method) {
    case 'initialize':
      return ok(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: SERVER_INFO });
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: MENTOR_TOOLS });
    case 'tools/call': {
      const { name, arguments: args = {} } = params as { name: string; arguments?: Record<string, unknown> };
      try {
        const content = await handleMentorToolCall(name, args, profile);
        return ok(id, { content });
      } catch (err) {
        return ok(id, { content: [{ type: 'text', text: `Error: ${(err as Error).message}` }], isError: true });
      }
    }
    default:
      return mcpError(id, -32601, `Method not found: ${method}`);
  }
}

export async function GET() {
  return new NextResponse('Use POST for tool calls.', { status: 405 });
}
