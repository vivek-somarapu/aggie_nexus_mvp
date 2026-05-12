import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildSystemPrompt } from '@/lib/ai/context-builder';
import type { AccelRole } from '@/lib/accel-types';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(4000),
    })
  ).min(1).max(20),
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

  const systemPrompt = await buildSystemPrompt(user.id, profile.role as AccelRole);

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: parsed.data.messages,
    maxTokens: 1024,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}
