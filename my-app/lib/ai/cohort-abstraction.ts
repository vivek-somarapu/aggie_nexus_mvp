import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { md5 } from '@/lib/ai/extract-file-text';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

async function abstractToLesson(
  contextKey: string,
  content: string,
  teamVertical: string | null,
): Promise<string> {
  const verticalHint = teamVertical ? ` working in ${teamVertical}` : '';

  const { text } = await generateText({
    model: groq('llama-3.3-70b-versatile'),
    temperature: 0.3,
    prompt: `You are extracting a generalizable cohort lesson from a startup's private company context.

CONTEXT TYPE: ${contextKey}
CONTENT: ${content}

Rewrite this as a cohort insight that:
1. Removes all identifying details (company name, founder names, specific product names, unique metrics)
2. Preserves the strategic pattern or insight
3. Uses "a cohort team${verticalHint}" or "one team" as the subject
4. Is useful for other founders at the same stage
5. Is 2-4 sentences maximum

Output only the lesson text — no preamble, no labels.`,
  });

  return text.trim();
}

export async function deriveAndStoreCohortLesson(
  teamId: string,
  contextKey: string,
  content: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: team } = await admin
    .from('accel_teams')
    .select('industry_vertical')
    .eq('id', teamId)
    .single();

  const lessonText = await abstractToLesson(contextKey, content, team?.industry_vertical ?? null);
  const contentHash = md5(lessonText);

  await admin
    .from('accel_cohort_lessons')
    .upsert(
      { lesson_text: lessonText, context_key: contextKey, content_hash: contentHash },
      { onConflict: 'content_hash', ignoreDuplicates: true },
    );
}
