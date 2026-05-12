import { createGroq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt, buildSemanticContext } from '@/lib/ai/context-builder';
import type { AccelRole } from '@/lib/accel-types';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// UIMessage parts schema — only validate the shape we care about
const TextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string().max(4000),
});

const AnyPartSchema = z.union([
  TextPartSchema,
  z.object({ type: z.string() }).passthrough(),
]);

const UIMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(AnyPartSchema),
  metadata: z.unknown().optional(),
});

const RequestSchema = z.object({
  messages: z.array(UIMessageSchema).min(1).max(20),
  // Fields sent by the SDK transport (ignored but allowed through)
  id: z.string().optional(),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 401);

  // Role check — only accelerator users
  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return errorResponse('No accelerator profile', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Invalid request body', 422);
  }

  // Extract the latest user message text for semantic search
  const lastUserText = parsed.data.messages
    .filter((m) => m.role === 'user')
    .at(-1)
    ?.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .trim() ?? '';

  // Build base context (Redis-cached) and semantic context (live) in parallel
  let systemPrompt: string;
  let semanticContext: string;
  try {
    [systemPrompt, semanticContext] = await Promise.all([
      buildSystemPrompt(user.id, profile.role as AccelRole),
      buildSemanticContext(lastUserText),
    ]);
  } catch (error) {
    console.error('[ai-advisor] Context build failed:', error);
    return errorResponse('Failed to load program context', 500);
  }

  const fullSystemPrompt = semanticContext
    ? `${systemPrompt}\n\n${semanticContext}`
    : systemPrompt;

  // convertToModelMessages converts UIMessage[] (parts-based) into ModelMessage[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelMessages = await convertToModelMessages(parsed.data.messages as any[]);

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: fullSystemPrompt,
    messages: modelMessages,
    maxTokens: 1024,
    temperature: 0.3,
  });

  // toTextStreamResponse streams plain text — pairs with TextStreamChatTransport
  // on the client. Simpler and more reliable than the UIMessage chunk protocol.
  return result.toTextStreamResponse();
}
