import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const ReviewSchema = z.object({
  score: z.number().int().min(1).max(5).optional(),
  comments: z.string().optional(),
  visibility: z.enum(['team', 'internal']).default('internal'),
  // Also allows updating submission status in the same request
  new_submission_status: z.enum([
    'under_review', 'approved', 'needs_revision', 'flagged',
  ]).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const { id: submissionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { score, comments, visibility, new_submission_status } = parsed.data;

  const supabase = await createClient();

  // Insert the review
  const { data: review, error: reviewError } = await supabase
    .from('accel_reviews')
    .insert({
      submission_id: submissionId,
      reviewer_id: profile.id,
      score: score ?? null,
      comments: comments ?? null,
      visibility,
    })
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  // Optionally update submission status in the same round trip
  if (new_submission_status) {
    await supabase
      .from('accel_submissions')
      .update({
        status: new_submission_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
  }

  return NextResponse.json(review, { status: 201 });
}
