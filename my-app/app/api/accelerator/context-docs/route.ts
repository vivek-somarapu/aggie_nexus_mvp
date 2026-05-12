import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

const MAX_CONTENT_BYTES = 100_000; // ~100 KB of plain text

const CreateDocSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(MAX_CONTENT_BYTES),
  doc_type: z.enum(['program_outline', 'team_application', 'reference', 'general']),
  team_id: z.string().uuid().nullable().optional(),
});

function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

async function requireAggiexTeam() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: errorResponse('Unauthorized', 401), supabase: null, user: null };

  const { data: profile } = await supabase
    .from('accel_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'aggiex_team') {
    return { error: errorResponse('Forbidden', 403), supabase: null, user: null };
  }

  return { error: null, supabase, user };
}

// ─── GET /api/accelerator/context-docs ────────────────────────────────────────

export async function GET() {
  const { error, supabase } = await requireAggiexTeam();
  if (error) return error;

  const { data, error: fetchError } = await supabase!
    .from('accel_context_docs')
    .select('id, title, doc_type, team_id, created_at, accel_teams (name)')
    .order('created_at', { ascending: false });

  if (fetchError) return errorResponse(fetchError.message, 500);

  return NextResponse.json({ docs: data ?? [] });
}

// ─── POST /api/accelerator/context-docs ───────────────────────────────────────

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await requireAggiexTeam();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = CreateDocSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('Invalid request body', 422);
  }

  const { title, content, doc_type, team_id } = parsed.data;
  const contentHash = md5(content);

  const { data, error: insertError } = await supabase!
    .from('accel_context_docs')
    .insert({
      title,
      content,
      doc_type,
      team_id: team_id ?? null,
      uploaded_by: user!.id,
      content_hash: contentHash,
    })
    .select('id, title, doc_type, team_id, created_at')
    .single();

  if (insertError) return errorResponse(insertError.message, 500);

  return NextResponse.json({ doc: data }, { status: 201 });
}
