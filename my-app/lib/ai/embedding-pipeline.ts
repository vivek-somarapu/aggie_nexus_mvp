/**
 * Embedding pipeline: fetches content from each source table, splits into
 * overlapping chunks, generates Jina embeddings per chunk, and stores them
 * in accel_embeddings.
 *
 * Chunking strategy: each document is split into ~400-token windows with
 * ~50-token overlap via chunkText(). Each chunk gets its own row in
 * accel_embeddings with a unique (source_table, source_id, chunk_index) key.
 *
 * Idempotency: the MD5 of the full document text is stored on every chunk row
 * as content_hash. If the hash is unchanged on a subsequent run, all chunks
 * for that document are skipped. When the document changes, all existing chunk
 * rows are deleted before the new chunks are inserted — this handles changes
 * in chunk count cleanly.
 */

import { createAdminClient } from '@/lib/supabase/accel-admin';
import { embedBatch } from '@/lib/ai/embedder';
import { chunkText } from '@/lib/ai/chunker';
import { extractTextFromStorageUrl, md5 } from '@/lib/ai/extract-file-text';

// ─── Submission sanitization ──────────────────────────────────────────────────
//
// Strip prompt-injection patterns from founder submissions before they enter
// the vector store. These patterns, if embedded, can be retrieved into the AI
// advisor's system prompt and influence model behavior.
//
// The regex targets instruction-override phrasing. Legitimate submission content
// describing products, metrics, and progress is unaffected.

const INJECTION_PATTERNS: RegExp[] = [
  /\bignore\b.{0,50}\b(previous|prior|above|all)\b.{0,30}\binstructions?\b/gi,
  /\b(forget|disregard|override)\b.{0,30}\b(instructions?|rules?|prompt|context)\b/gi,
  /\byou are now\b.{0,80}/gi,
  /\bact as\b.{0,40}\b(an?\s+)?(?:unfiltered|unrestricted|jailbroken|dAN)/gi,
  /^\s*system\s*:/gim,
  /\b(reveal|expose|leak|print|output|show)\b.{0,30}\b(all|every|other|private)\b.{0,30}\b(teams?|data|submissions?|users?)\b/gi,
];

function sanitizeSubmissionForEmbedding(text: string): string {
  let sanitized = text;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }
  return sanitized;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EmbeddingSource =
  | 'accel_curriculum_files'
  | 'accel_deliverables'
  | 'accel_submissions'
  | 'accel_meeting_records'
  | 'accel_context_docs'
  | 'accel_team_context'
  | 'accel_cohort_lessons';

interface EmbeddingRow {
  source_table: EmbeddingSource;
  source_id: string;
  chunk_index: number;
  chunk_text: string;
  content_hash: string;
  embedding: number[];
  embedded_at: string;
  team_id: string | null;
}

export interface EmbedSourceResult {
  source: EmbeddingSource;
  upserted: number;
  skipped: number;
}

export interface EmbedAllResult {
  results: EmbedSourceResult[];
  totalUpserted: number;
  totalSkipped: number;
  durationMs: number;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Returns a map of source_id → content_hash for all existing rows in a source
 * table. All chunks of a document share the same content_hash, so the first
 * occurrence per source_id is used.
 */
async function fetchExistingHashes(
  sourceTable: EmbeddingSource,
): Promise<Map<string, string>> {
  const supabase = createAdminClient();

  // Only consider rows that were embedded with the v2 chunking pipeline
  // (chunk_text is non-empty). Rows migrated from v1 have chunk_text = ''
  // and must be treated as stale so they get rechunked on the next sync.
  const { data, error } = await supabase
    .from('accel_embeddings')
    .select('source_id, content_hash')
    .eq('source_table', sourceTable)
    .neq('chunk_text', '');

  if (error) {
    throw new Error(`Failed to fetch existing hashes for ${sourceTable}: ${error.message}`);
  }

  const hashes = new Map<string, string>();
  for (const row of data ?? []) {
    if (!hashes.has(row.source_id)) {
      hashes.set(row.source_id, row.content_hash);
    }
  }
  return hashes;
}

/**
 * Deletes all chunk rows for the given source IDs, then inserts the new rows.
 * Delete-before-insert (rather than upsert) is required because the chunk
 * count can change when document content is updated.
 */
async function replaceEmbeddings(
  sourceTable: EmbeddingSource,
  changedIds: string[],
  rows: EmbeddingRow[],
): Promise<void> {
  if (rows.length === 0) return;

  const supabase = createAdminClient();

  const { error: deleteError } = await supabase
    .from('accel_embeddings')
    .delete()
    .eq('source_table', sourceTable)
    .in('source_id', changedIds);

  if (deleteError) {
    throw new Error(`Failed to delete stale embeddings for ${sourceTable}: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase
    .from('accel_embeddings')
    .insert(rows);

  if (insertError) {
    throw new Error(`Failed to insert embeddings for ${sourceTable}: ${insertError.message}`);
  }
}

/**
 * Splits each document into chunks, embeds all chunks in one Jina batch call,
 * and returns the full set of EmbeddingRow objects ready for insertion.
 */
async function buildChunkedRows(
  source: EmbeddingSource,
  documents: Array<{ id: string; fullText: string; contentHash?: string; teamId?: string | null }>,
): Promise<EmbeddingRow[]> {
  type FlatChunk = {
    sourceId: string;
    chunkIndex: number;
    chunkText: string;
    contentHash: string;
    teamId: string | null;
  };

  const flatChunks: FlatChunk[] = [];

  for (const doc of documents) {
    const chunks = chunkText(doc.fullText);
    const contentHash = doc.contentHash ?? md5(doc.fullText);
    for (let i = 0; i < chunks.length; i++) {
      flatChunks.push({
        sourceId: doc.id,
        chunkIndex: i,
        chunkText: chunks[i],
        contentHash,
        teamId: doc.teamId ?? null,
      });
    }
  }

  if (flatChunks.length === 0) return [];

  const embedded = await embedBatch(flatChunks.map((c) => c.chunkText));
  const now = new Date().toISOString();

  return flatChunks.map((chunk, i) => ({
    source_table: source,
    source_id: chunk.sourceId,
    chunk_index: chunk.chunkIndex,
    chunk_text: chunk.chunkText,
    content_hash: chunk.contentHash,
    embedding: embedded[i].vector,
    embedded_at: now,
    team_id: chunk.teamId,
  }));
}

// ─── Source-specific embedders ────────────────────────────────────────────────

// ─── Curriculum helpers ───────────────────────────────────────────────────────

type CurriculumFileRow = {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_url: string;
};

/**
 * Hash used to detect changes without fetching file bytes on every sync run.
 * For uploaded files (pdf/docx), the Supabase Storage URL acts as a content
 * address — every upload generates a new UUID path, so URL change ≡ content
 * change. For link-type resources, only title and description matter.
 */
function buildCurriculumHash(file: CurriculumFileRow): string {
  const base = `${file.title}${file.description ? `: ${file.description}` : ''}`;
  if (file.file_type === 'pdf' || file.file_type === 'docx') {
    return md5(`${base}\n${file.file_url}`);
  }
  return md5(base);
}

async function buildCurriculumFullText(file: CurriculumFileRow): Promise<string> {
  const base = `${file.title}${file.description ? `: ${file.description}` : ''}`;
  if (file.file_type === 'pdf' || file.file_type === 'docx') {
    try {
      const extracted = await extractTextFromStorageUrl(
        file.file_url,
        file.file_type as 'pdf' | 'docx',
      );
      return extracted ? `${base}\n\n${extracted}` : base;
    } catch (extractError) {
      console.error(
        `[embedding] Could not extract text from curriculum file ${file.file_url}:`,
        extractError,
      );
      return base;
    }
  }
  return base;
}

// ─── Source embedders ─────────────────────────────────────────────────────────

async function embedCurriculumFiles(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_curriculum_files';
  const supabase = createAdminClient();

  const { data: files, error } = await supabase
    .from('accel_curriculum_files')
    .select('id, title, description, file_type, file_url')
    .eq('is_active', true);

  if (error) throw new Error(`Failed to fetch curriculum files: ${error.message}`);
  if (!files?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = files.filter(
    (file) => existingHashes.get(file.id) !== buildCurriculumHash(file),
  );

  if (changed.length === 0) return { source, upserted: 0, skipped: files.length };

  const documents = await Promise.all(
    changed.map(async (file) => ({
      id: file.id,
      fullText: await buildCurriculumFullText(file),
      contentHash: buildCurriculumHash(file),
    })),
  );

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((f) => f.id), rows);

  return { source, upserted: rows.length, skipped: files.length - changed.length };
}

async function embedDeliverables(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_deliverables';
  const supabase = createAdminClient();

  const { data: deliverables, error } = await supabase
    .from('accel_deliverables')
    .select('id, title, expected_format');

  if (error) throw new Error(`Failed to fetch deliverables: ${error.message}`);
  if (!deliverables?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = deliverables.filter((deliverable) => {
    const text = `${deliverable.title} (format: ${deliverable.expected_format})`;
    return existingHashes.get(deliverable.id) !== md5(text);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: deliverables.length };

  const documents = changed.map((deliverable) => ({
    id: deliverable.id,
    fullText: `${deliverable.title} (format: ${deliverable.expected_format})`,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((d) => d.id), rows);

  return { source, upserted: rows.length, skipped: deliverables.length - changed.length };
}

async function embedSubmissions(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_submissions';
  const supabase = createAdminClient();

  // Only embed finalized submissions — in_progress drafts are unstable.
  const { data: submissions, error } = await supabase
    .from('accel_submissions')
    .select('id, text_content, team_id')
    .in('status', ['submitted', 'under_review', 'approved'])
    .not('text_content', 'is', null);

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  if (!submissions?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = submissions.filter((submission) => {
    const text = submission.text_content as string;
    return existingHashes.get(submission.id) !== md5(text);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: submissions.length };

  const documents = changed.map((submission) => ({
    id: submission.id,
    fullText: sanitizeSubmissionForEmbedding(submission.text_content as string),
    teamId: submission.team_id as string | null,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((s) => s.id), rows);

  return { source, upserted: rows.length, skipped: submissions.length - changed.length };
}

async function embedMeetingRecords(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_meeting_records';
  const supabase = createAdminClient();

  const { data: meetings, error } = await supabase
    .from('accel_meeting_records')
    .select('id, notes, team_id')
    .not('notes', 'is', null);

  if (error) throw new Error(`Failed to fetch meeting records: ${error.message}`);
  if (!meetings?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = meetings.filter((meeting) => {
    const text = meeting.notes as string;
    return existingHashes.get(meeting.id) !== md5(text);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: meetings.length };

  const documents = changed.map((meeting) => ({
    id: meeting.id,
    fullText: meeting.notes as string,
    teamId: meeting.team_id as string | null,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((m) => m.id), rows);

  return { source, upserted: rows.length, skipped: meetings.length - changed.length };
}

async function embedContextDocs(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_context_docs';
  const supabase = createAdminClient();

  const { data: docs, error } = await supabase
    .from('accel_context_docs')
    .select('id, title, content');

  if (error) throw new Error(`Failed to fetch context docs: ${error.message}`);
  if (!docs?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = docs.filter((doc) => {
    const text = `${doc.title}\n\n${doc.content}`;
    return existingHashes.get(doc.id) !== md5(text);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: docs.length };

  const documents = changed.map((doc) => ({
    id: doc.id,
    fullText: `${doc.title}\n\n${doc.content}`,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((doc) => doc.id), rows);

  return { source, upserted: rows.length, skipped: docs.length - changed.length };
}

async function embedTeamContext(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_team_context';
  const supabase = createAdminClient();

  const { data: contexts, error } = await supabase
    .from('accel_team_context')
    .select('id, team_id, context_key, content');

  if (error) throw new Error(`Failed to fetch team context: ${error.message}`);
  if (!contexts?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = contexts.filter((ctx) => {
    const fullText = `${ctx.context_key}: ${ctx.content}`;
    return existingHashes.get(ctx.id) !== md5(fullText);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: contexts.length };

  const documents = changed.map((ctx) => ({
    id: ctx.id,
    fullText: `${ctx.context_key}: ${ctx.content}`,
    teamId: ctx.team_id as string | null,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((ctx) => ctx.id), rows);

  return { source, upserted: rows.length, skipped: contexts.length - changed.length };
}

async function embedCohortLessons(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_cohort_lessons';
  const supabase = createAdminClient();

  const { data: lessons, error } = await supabase
    .from('accel_cohort_lessons')
    .select('id, lesson_text');

  if (error) throw new Error(`Failed to fetch cohort lessons: ${error.message}`);
  if (!lessons?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = lessons.filter((lesson) => existingHashes.get(lesson.id) !== md5(lesson.lesson_text));

  if (changed.length === 0) return { source, upserted: 0, skipped: lessons.length };

  const documents = changed.map((lesson) => ({
    id: lesson.id,
    fullText: lesson.lesson_text,
    teamId: null,
  }));

  const rows = await buildChunkedRows(source, documents);
  await replaceEmbeddings(source, changed.map((l) => l.id), rows);

  return { source, upserted: rows.length, skipped: lessons.length - changed.length };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Embeds a single team context entry immediately after upsert without waiting
 * for a full sync run. Used by the MCP handler and AI advisor tool.
 */
export async function embedTeamContextEntry(
  teamId: string,
  contextKey: string,
  content: string,
): Promise<void> {
  const source: EmbeddingSource = 'accel_team_context';
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from('accel_team_context')
    .select('id')
    .eq('team_id', teamId)
    .eq('context_key', contextKey)
    .single();

  if (!row) return;

  const fullText = `${contextKey}: ${content}`;
  const existingHashes = await fetchExistingHashes(source);
  const newHash = md5(fullText);
  if (existingHashes.get(row.id) === newHash) return;

  const rows = await buildChunkedRows(source, [{ id: row.id, fullText, teamId }]);
  await replaceEmbeddings(source, [row.id], rows);
}

/**
 * Embeds a single curriculum file by ID. Used for immediate background indexing
 * after upload without waiting for a full sync. Skips if the hash is unchanged.
 */
export async function embedCurriculumFile(fileId: string): Promise<void> {
  const source: EmbeddingSource = 'accel_curriculum_files';
  const supabase = createAdminClient();

  const { data: file, error } = await supabase
    .from('accel_curriculum_files')
    .select('id, title, description, file_type, file_url, is_active')
    .eq('id', fileId)
    .single();

  if (error || !file) {
    console.error(`[embedding] Failed to fetch curriculum file ${fileId}:`, error?.message);
    return;
  }

  if (!file.is_active) return;

  const existingHashes = await fetchExistingHashes(source);
  const newHash = buildCurriculumHash(file);
  if (existingHashes.get(file.id) === newHash) return;

  const fullText = await buildCurriculumFullText(file);
  const rows = await buildChunkedRows(source, [{ id: file.id, fullText, contentHash: newHash }]);
  await replaceEmbeddings(source, [file.id], rows);
}

/**
 * Removes all embedding rows for a curriculum file. Called on hard-delete or
 * when is_active is set to false so the file is immediately excluded from RAG.
 */
export async function deleteCurriculumFileEmbeddings(fileId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('accel_embeddings')
    .delete()
    .eq('source_table', 'accel_curriculum_files')
    .eq('source_id', fileId);

  if (error) {
    console.error(`[embedding] Failed to delete embeddings for curriculum file ${fileId}:`, error.message);
  }
}

/**
 * Re-embeds all five source tables in parallel. Idempotent: documents whose
 * full-text MD5 hash is unchanged are skipped entirely.
 */
export async function embedAllSources(): Promise<EmbedAllResult> {
  const startTime = Date.now();

  const results = await Promise.all([
    embedCurriculumFiles(),
    embedDeliverables(),
    embedSubmissions(),
    embedMeetingRecords(),
    embedContextDocs(),
    embedTeamContext(),
    embedCohortLessons(),
  ]);

  const totalUpserted = results.reduce((sum, result) => sum + result.upserted, 0);
  const totalSkipped = results.reduce((sum, result) => sum + result.skipped, 0);

  return {
    results,
    totalUpserted,
    totalSkipped,
    durationMs: Date.now() - startTime,
  };
}
