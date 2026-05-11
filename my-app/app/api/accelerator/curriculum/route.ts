import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';

const CreateCurriculumFileSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  file_type: z.enum(['pdf', 'docx', 'video_link', 'external_link', 'other']),
  file_url: z.string().url('Must be a valid URL'),
  week_id: z.string().uuid().optional(),
  access_level: z.enum(['all', 'founders_only', 'aggiex_internal']).default('all'),
  // null = all teams; array of UUIDs = specific teams only
  assigned_team_ids: z.array(z.string().uuid()).nullable().default(null),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAccelRole([
    'founder', 'aggiex_team', 'mce_staff', 'mentor',
  ]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const weekId = searchParams.get('week_id');

  const supabase = await createClient();

  let query = supabase
    .from('accel_curriculum_files')
    .select(`
      id, week_id, program_id, title, description,
      file_type, file_url, access_level, is_active, uploaded_at, uploader_id,
      accel_weeks (week_number, theme)
    `)
    .eq('program_id', AGGIEX_2026_PROGRAM_ID)
    .order('uploaded_at', { ascending: false });

  if (weekId) query = query.eq('week_id', weekId);

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const { profile, error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = CreateCurriculumFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_curriculum_files')
    .insert({
      ...parsed.data,
      program_id: AGGIEX_2026_PROGRAM_ID,
      uploader_id: profile.id,
      is_active: true,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
