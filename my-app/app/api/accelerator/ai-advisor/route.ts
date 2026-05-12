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
  // Fields sent by the new SDK transport (ignored but allowed)
  id: z.string().optional(),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Role check — only accelerator users
  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return new Response(JSON.stringify({ error: 'No accelerator profile' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Extract the latest user message text for semantic search.
  const lastUserText = parsed.data.messages
    .filter((m) => m.role === 'user')
    .at(-1)
    ?.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .trim() ?? '';

  // Build base context (cached) and semantic context (live, query-specific) in parallel.
  const [systemPrompt, semanticContext] = await Promise.all([
    buildSystemPrompt(user.id, profile.role as AccelRole),
    buildSemanticContext(lastUserText),
  ]);

  const fullSystemPrompt = semanticContext
    ? `${systemPrompt}\n\n${semanticContext}`
    : systemPrompt;

  // convertToModelMessages converts UIMessage[] (parts-based) to ModelMessage[] for streamText
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelMessages = convertToModelMessages(parsed.data.messages as any[]);

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: fullSystemPrompt,
    messages: modelMessages,
    maxTokens: 1024,
    temperature: 0.3,
  });

  return result.toUIMessageStreamResponse();
}
