import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';

const PatchCurriculumFileSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  file_type: z.enum(['pdf', 'docx', 'video_link', 'external_link', 'other']).optional(),
  file_url: z.string().url('Must be a valid URL').optional(),
  week_id: z.string().uuid().nullable().optional(),
  access_level: z.enum(['all', 'founders_only', 'aggiex_internal']).optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = PatchCurriculumFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_curriculum_files')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Hard delete is aggiex_team only — mce_staff should use PATCH is_active=false
  const { error } = await requireAccelRole(['aggiex_team']);
  if (error) return error;

  const { id } = await params;
  const supabase = await createClient();

  const { error: dbError } = await supabase
    .from('accel_curriculum_files')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
