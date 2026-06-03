import { NextRequest, NextResponse } from 'next/server';
import { requireAccelAuth } from '@/lib/accel-auth';
import { FOUNDER_TOOLS, handleFounderToolCall } from './tools';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SERVER_INFO = {
  name: 'aggiex-founder',
  version: '1.0.0',
  instructions:
    'AggieX founder tools. Start with whoami, then get_pending_deliverables to see what needs to be done. ' +
    'Use submit_deliverable to submit text responses, log_traction to record metrics.',
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
  const { profile, error: authError } = await requireAccelAuth(request, ['founder']);
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
      return ok(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: FOUNDER_TOOLS });

    case 'tools/call': {
      const { name, arguments: args = {} } = params as {
        name: string;
        arguments?: Record<string, unknown>;
      };
      try {
        const content = await handleFounderToolCall(name, args, profile);
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

export async function GET() {
  return new NextResponse('Use POST for tool calls.', { status: 405 });
}
