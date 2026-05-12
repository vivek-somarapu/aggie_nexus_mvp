import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024; // 10 MB raw upload
const MAX_EXTRACTED_CHARS = 200_000;          // ~200 KB of extracted text

const VALID_DOC_TYPES = ['program_outline', 'team_application', 'reference', 'general'] as const;
type DocType = typeof VALID_DOC_TYPES[number];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Text extraction ──────────────────────────────────────────────────────────

/**
 * Extracts plain text from an uploaded file.
 * PDF  → pdf-parse (pdfjs-dist under the hood, text layer only)
 * DOCX → mammoth (unzips the Office XML, pulls text nodes)
 * TXT / MD / CSV → UTF-8 decode
 */
async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('File too large. Maximum upload size is 10 MB.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    // Dynamic import keeps this out of the client bundle entirely.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // .txt / .md / .csv — plain UTF-8
  return buffer.toString('utf-8');
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
// Accepts multipart/form-data with fields:
//   title    (string, required)
//   doc_type (string, required)
//   team_id  (string uuid, optional)
//   file     (File, optional — PDF / DOCX / TXT / MD / CSV)
//   content  (string, optional — pasted plain text, used when no file is provided)

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await requireAggiexTeam();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Expected multipart/form-data', 400);
  }

  // ── Field extraction ──
  const title = (formData.get('title') as string | null)?.trim() ?? '';
  const docTypeRaw = formData.get('doc_type') as string | null;
  const teamIdRaw = formData.get('team_id') as string | null;
  const file = formData.get('file') as File | null;
  const pastedContent = (formData.get('content') as string | null)?.trim() ?? '';

  // ── Validation ──
  if (!title || title.length > 200) {
    return errorResponse('Title is required and must be under 200 characters.', 422);
  }

  if (!docTypeRaw || !(VALID_DOC_TYPES as readonly string[]).includes(docTypeRaw)) {
    return errorResponse(`doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}`, 422);
  }
  const docType = docTypeRaw as DocType;

  const teamId = teamIdRaw && UUID_REGEX.test(teamIdRaw) ? teamIdRaw : null;

  // ── Text resolution ──
  let content: string;

  if (file && file.size > 0) {
    try {
      content = await extractTextFromFile(file);
    } catch (extractionError) {
      const message = extractionError instanceof Error
        ? extractionError.message
        : 'Failed to extract text from file.';
      return errorResponse(message, 422);
    }
  } else if (pastedContent) {
    content = pastedContent;
  } else {
    return errorResponse('Provide a file or paste content directly.', 422);
  }

  content = content.trim();

  if (!content) {
    return errorResponse('No text could be extracted from the file.', 422);
  }

  // Truncate oversized content rather than rejecting outright — large PDFs are
  // common and the embedding model caps at ~8K tokens anyway.
  if (content.length > MAX_EXTRACTED_CHARS) {
    content = content.slice(0, MAX_EXTRACTED_CHARS);
  }

  // ── Persist ──
  const contentHash = md5(content);

  const { data, error: insertError } = await supabase!
    .from('accel_context_docs')
    .insert({
      title,
      content,
      doc_type: docType,
      team_id: teamId,
      uploaded_by: user!.id,
      content_hash: contentHash,
    })
    .select('id, title, doc_type, team_id, created_at')
    .single();

  if (insertError) return errorResponse(insertError.message, 500);

  return NextResponse.json({ doc: data }, { status: 201 });
}
