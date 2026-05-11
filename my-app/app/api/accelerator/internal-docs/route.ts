import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAccelRole } from '@/lib/accel-auth';
import { createClient } from '@/lib/supabase/server';
import { AGGIEX_2026_PROGRAM_ID } from '@/lib/accel-types';

const CreateDocSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  file_url: z.string().url('Must be a valid URL'),
  file_type: z.enum(['pdf', 'docx', 'link', 'other']).default('other'),
  visibility: z.enum(['aggiex_only', 'aggiex_mce']).default('aggiex_mce'),
});

export async function GET() {
  const { error } = await requireAccelRole(['aggiex_team', 'mce_staff']);
  if (error) return error;

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_internal_docs')
    .select(`
      id, title, description, file_url, file_type, visibility, status, created_at,
      accel_profiles!accel_internal_docs_uploader_id_fkey (full_name)
    `)
    .eq('program_id', AGGIEX_2026_PROGRAM_ID)
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
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

  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const supabase = await createClient();

  const { data, error: dbError } = await supabase
    .from('accel_internal_docs')
    .insert({
      ...parsed.data,
      program_id: AGGIEX_2026_PROGRAM_ID,
      uploader_id: profile.id,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
