#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_KEY = process.env.AGGIEX_API_KEY;
const BASE_URL = (process.env.AGGIEX_BASE_URL ?? 'https://caneckt.aggiex.org').replace(/\/$/, '');

if (!API_KEY) {
  console.error('AGGIEX_API_KEY environment variable is required.');
  process.exit(1);
}

const HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
};

async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.headers ?? {}) },
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data !== null && 'error' in data
      ? (data as { error: string }).error
      : `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }
  return data;
}

const server = new Server(
  { name: 'aggiex-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
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
      name: 'submit_deliverable',
      description: 'Submit a text response for a specific deliverable.',
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_team_status') {
      const me = await apiFetch('/api/accelerator/me') as {
        full_name: string;
        role: string;
        team: { name: string; venture_stage: string } | null;
        current_week: { week_number: number; theme: string } | null;
      };
      const lines: string[] = [
        `Founder: ${me.full_name}`,
        `Team: ${me.team?.name ?? 'No team assigned'}`,
        me.team?.venture_stage ? `Stage: ${me.team.venture_stage}` : '',
        me.current_week
          ? `Current week: Week ${me.current_week.week_number} — ${me.current_week.theme}`
          : 'No active week',
      ].filter(Boolean);
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    if (name === 'get_pending_deliverables') {
      const me = await apiFetch('/api/accelerator/me') as { team: { id: string } | null };
      if (!me.team) {
        return { content: [{ type: 'text', text: 'No team assigned.' }] };
      }
      const submissions = await apiFetch(
        `/api/accelerator/submissions?team_id=${me.team.id}`
      ) as Array<{ deliverable_id: string; status: string }>;

      const submittedIds = new Set(
        (submissions ?? [])
          .filter((s) => !['not_started', 'needs_revision'].includes(s.status))
          .map((s) => s.deliverable_id)
      );

      const data = await apiFetch('/api/accelerator/deliverables') as Array<{
        id: string;
        title: string;
        description: string | null;
        expected_format: string;
        is_required: boolean;
      }>;

      const pending = (data ?? []).filter((d) => !submittedIds.has(d.id));
      if (!pending.length) {
        return { content: [{ type: 'text', text: 'All deliverables submitted!' }] };
      }

      const lines = pending.map((d) =>
        `- [${d.id}] ${d.title} (${d.expected_format}${d.is_required ? ', required' : ''})\n  ${d.description ?? ''}`
      );
      return {
        content: [{ type: 'text', text: `Pending deliverables:\n${lines.join('\n')}` }],
      };
    }

    if (name === 'submit_deliverable') {
      const { deliverable_id, text_content } = args as {
        deliverable_id: string;
        text_content: string;
      };
      const me = await apiFetch('/api/accelerator/me') as { team: { id: string } | null };
      if (!me.team) throw new Error('No team assigned.');

      await apiFetch('/api/accelerator/submissions', {
        method: 'POST',
        body: JSON.stringify({
          deliverable_id,
          team_id: me.team.id,
          status: 'submitted',
          text_content,
        }),
      });
      return { content: [{ type: 'text', text: 'Deliverable submitted successfully.' }] };
    }

    if (name === 'log_traction') {
      const { metric_type, value, unit, notes, entry_date } = args as {
        metric_type: string;
        value: number;
        unit: string;
        notes?: string;
        entry_date?: string;
      };
      const me = await apiFetch('/api/accelerator/me') as { team: { id: string } | null };
      if (!me.team) throw new Error('No team assigned.');

      await apiFetch('/api/accelerator/traction', {
        method: 'POST',
        body: JSON.stringify({
          team_id: me.team.id,
          metric_type,
          value,
          unit,
          notes: notes ?? '',
          entry_date: entry_date ?? new Date().toISOString().split('T')[0],
        }),
      });
      return {
        content: [{ type: 'text', text: `Logged ${value} ${unit} (${metric_type}).` }],
      };
    }

    if (name === 'get_traction_history') {
      const me = await apiFetch('/api/accelerator/me') as { team: { id: string } | null };
      if (!me.team) return { content: [{ type: 'text', text: 'No team assigned.' }] };

      const entries = await apiFetch(
        `/api/accelerator/traction?team_id=${me.team.id}`
      ) as Array<{
        metric_type: string;
        value: number;
        unit: string;
        entry_date: string;
        notes: string | null;
      }>;

      if (!entries?.length) {
        return { content: [{ type: 'text', text: 'No traction entries yet.' }] };
      }

      const lines = entries
        .slice(0, 20)
        .map((e) => `- ${e.entry_date}: ${e.value} ${e.unit} (${e.metric_type})${e.notes ? ` — ${e.notes}` : ''}`);
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
