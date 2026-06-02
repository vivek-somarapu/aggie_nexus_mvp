import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const AddFileSchema = z.object({
  file_url: z.string().url(),
  file_name: z.string().min(1).max(500),
  file_type: z.enum(['pdf', 'docx', 'image', 'link', 'other']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { profile, error } = await requireAccelRole(['founder', 'aggiex_team', 'mce_staff']);
  if (error) return error;

  const { id: submissionId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AddFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  // Founders can only attach files to their own team's submissions
  if (profile.role === 'founder') {
    const { data: submission } = await supabase
      .from('accel_submissions')
      .select('team_id')
      .eq('id', submissionId)
      .single();

    if (!submission || submission.team_id !== profile.team_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { data, error: insertError } = await supabase
    .from('accel_submission_files')
    .insert({
      submission_id: submissionId,
      file_url: parsed.data.file_url,
      file_name: parsed.data.file_name,
      file_type: parsed.data.file_type,
      uploaded_by: profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
