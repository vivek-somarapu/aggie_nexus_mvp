import { NextRequest, NextResponse } from 'next/server';
import { requireAccelAuth } from '@/lib/accel-auth';
import { STAFF_TOOLS, handleToolCall } from './tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SERVER_INFO = {
  name: 'aggiex-staff',
  version: '1.0.0',
  instructions:
    'AggieX staff tools for program management. ' +
    'Use process_meeting_notes to analyze a photo of meeting notes and extract action items. ' +
    'Use add_deliverable to create deliverables for teams. ' +
    'All reads return live data from the AggieX platform.',
};

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
  const { profile, keyId, error: authError } = await requireAccelAuth(request, ['aggiex_team', 'mce_staff']);
  if (authError) return authError;

  let body: McpMessage;
  try {
    body = await request.json() as McpMessage;
  } catch {
    return mcpError(null, -32700, 'Parse error');
  }

  const { method, params, id } = body;

  // Notifications (no id) expect no JSON response — 202 Accepted
  if (id === undefined && method.startsWith('notifications/')) {
    return new NextResponse(null, { status: 202 });
  }

  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: STAFF_TOOLS });

    case 'tools/call': {
      const { name, arguments: args = {} } = params as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      try {
        const content = await handleToolCall(name, args, profile, keyId);
        return ok(id, { content });
      } catch (err) {
        return ok(id, {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return mcpError(id, -32601, `Method not found: ${method}`);
  }
}

// GET is required by the Streamable HTTP spec for SSE streaming sessions.
// We don't support persistent streaming — return 405 so clients fall back to polling.
export async function GET() {
  return new NextResponse('Streaming sessions not supported — use POST for tool calls.', {
    status: 405,
  });
}
