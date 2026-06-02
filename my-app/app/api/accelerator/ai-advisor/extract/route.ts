import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const METRIC_TYPES = ['revenue', 'users', 'lois', 'pilots', 'retention', 'churn', 'other'] as const;

const ExtractionSchema = z.object({
  deliverables: z.array(z.object({
    id: z.string().describe('The exact UUID of the deliverable from the list'),
    title: z.string().describe('The deliverable title'),
    text_content: z.string().describe('A professional summary of what the founder said about this deliverable'),
    confidence: z.number().min(0).max(1).describe('How confident you are this deliverable is being referenced'),
  })),
  traction: z.array(z.object({
    metric_type: z.enum(METRIC_TYPES).describe('Category of the metric'),
    value: z.number().describe('Numeric value'),
    unit: z.string().describe('Unit of measurement, e.g. "users", "USD/mo", "%"'),
    notes: z.string().optional().describe('Additional context from the founder'),
  })),
  summary: z.string().describe('One concise sentence describing what was detected overall'),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'founder') {
    return NextResponse.json({ error: 'Only founders can use this feature' }, { status: 403 });
  }

  if (!profile.team_id) {
    return NextResponse.json({ error: 'No team assigned' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { transcript } = body as { transcript?: string };
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
  }

  // Fetch unlocked weeks
  const { data: weeks } = await supabase
    .from('accel_weeks')
    .select('id, week_number, theme')
    .eq('is_unlocked', true)
    .order('week_number');

  if (!weeks?.length) {
    return NextResponse.json({ deliverables: [], traction: [], summary: 'No active weeks found.' });
  }

  const weekIds = weeks.map((w) => w.id);

  // Fetch deliverables that accept text input
  const { data: deliverables } = await supabase
    .from('accel_deliverables')
    .select('id, week_id, title, description, expected_format, is_required')
    .in('week_id', weekIds)
    .in('expected_format', ['text', 'any']);

  if (!deliverables?.length) {
    return NextResponse.json({ deliverables: [], traction: [], summary: 'No text deliverables active.' });
  }

  // Filter out already-approved deliverables
  const deliverableIds = deliverables.map((d) => d.id);
  const { data: submissions } = await supabase
    .from('accel_submissions')
    .select('deliverable_id, status')
    .eq('team_id', profile.team_id)
    .in('deliverable_id', deliverableIds)
    .order('version', { ascending: false });

  const latestStatusByDeliverable = new Map<string, string>();
  for (const s of submissions ?? []) {
    if (!latestStatusByDeliverable.has(s.deliverable_id)) {
      latestStatusByDeliverable.set(s.deliverable_id, s.status);
    }
  }

  const candidateDeliverables = deliverables.filter(
    (d) => latestStatusByDeliverable.get(d.id) !== 'approved'
  );

  if (!candidateDeliverables.length) {
    return NextResponse.json({ deliverables: [], traction: [], summary: 'All deliverables already approved.' });
  }

  const weekById = new Map(weeks.map((w) => [w.id, w]));
  const deliverablesList = candidateDeliverables
    .map((d) => {
      const week = weekById.get(d.week_id);
      return `- ID: ${d.id}\n  Title: "${d.title}"\n  Week ${week?.week_number} (${week?.theme})\n  Description: ${d.description ?? 'none'}\n  Required: ${d.is_required}`;
    })
    .join('\n');

  const systemPrompt = `You are an AI assistant helping founders in an accelerator program log their weekly progress.

Analyze the founder's statement and extract two types of information:

1. DELIVERABLES: Which items from the list below they are describing as completed or in progress.
   - Only match deliverables that are clearly referenced or implied by the founder's words
   - For text_content, write a concise, professional response that captures what the founder said
   - Only include items with confidence >= 0.65

2. TRACTION: Any business metrics mentioned with numeric values (users, revenue, LOIs signed, pilots, retention/churn %).

Available deliverables (text submissions only):
${deliverablesList}

If nothing relevant is mentioned, return empty arrays. Do not invent or hallucinate data.`;

  const { object } = await generateObject({
    model: groq('llama-3.3-70b-versatile'),
    schema: ExtractionSchema,
    system: systemPrompt,
    prompt: `Founder's statement: "${transcript.trim()}"`,
    temperature: 0.1,
  });

  // Filter to only high-confidence deliverable matches
  const filtered: ExtractionResult & { team_id: string } = {
    ...object,
    deliverables: object.deliverables.filter((d) => d.confidence >= 0.65),
    team_id: profile.team_id,
  };

  return NextResponse.json(filtered);
}
