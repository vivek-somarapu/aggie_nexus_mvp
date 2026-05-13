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

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { embedBatch } from '@/lib/ai/embedder';
import { chunkText } from '@/lib/ai/chunker';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmbeddingSource =
  | 'accel_curriculum_files'
  | 'accel_deliverables'
  | 'accel_submissions'
  | 'accel_meeting_records'
  | 'accel_context_docs';

interface EmbeddingRow {
  source_table: EmbeddingSource;
  source_id: string;
  chunk_index: number;
  chunk_text: string;
  content_hash: string;
  embedding: number[];
  embedded_at: string;
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

function md5(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

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
  documents: Array<{ id: string; fullText: string }>,
): Promise<EmbeddingRow[]> {
  type FlatChunk = {
    sourceId: string;
    chunkIndex: number;
    chunkText: string;
    contentHash: string;
  };

  const flatChunks: FlatChunk[] = [];

  for (const doc of documents) {
    const chunks = chunkText(doc.fullText);
    const contentHash = md5(doc.fullText);
    for (let i = 0; i < chunks.length; i++) {
      flatChunks.push({ sourceId: doc.id, chunkIndex: i, chunkText: chunks[i], contentHash });
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
  }));
}

// ─── Source-specific embedders ────────────────────────────────────────────────

async function embedCurriculumFiles(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_curriculum_files';
  const supabase = createAdminClient();

  const { data: files, error } = await supabase
    .from('accel_curriculum_files')
    .select('id, title, description')
    .eq('is_active', true);

  if (error) throw new Error(`Failed to fetch curriculum files: ${error.message}`);
  if (!files?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const changed = files.filter((file) => {
    const text = `${file.title}${file.description ? `: ${file.description}` : ''}`;
    return existingHashes.get(file.id) !== md5(text);
  });

  if (changed.length === 0) return { source, upserted: 0, skipped: files.length };

  const documents = changed.map((file) => ({
    id: file.id,
    fullText: `${file.title}${file.description ? `: ${file.description}` : ''}`,
  }));

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
    .select('id, text_content')
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
    fullText: submission.text_content as string,
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
    .select('id, notes')
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

// ─── Public API ───────────────────────────────────────────────────────────────

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
