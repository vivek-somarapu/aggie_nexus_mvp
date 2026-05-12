/**
 * Embedding pipeline: fetches content from each source table, generates
 * Jina embeddings, and upserts into accel_embeddings.
 *
 * Content hashing (MD5) prevents re-embedding unchanged rows, making
 * repeated runs cheap and idempotent.
 */

import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/accel-admin';
import { embedBatch } from '@/lib/ai/embedder';

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
 * Fetches existing content_hash values for a source table so unchanged rows
 * can be skipped without re-embedding.
 */
async function fetchExistingHashes(
  sourceTable: EmbeddingSource,
): Promise<Map<string, string>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('accel_embeddings')
    .select('source_id, content_hash')
    .eq('source_table', sourceTable);

  if (error) {
    throw new Error(`Failed to fetch existing hashes for ${sourceTable}: ${error.message}`);
  }

  const hashes = new Map<string, string>();
  for (const row of data ?? []) {
    hashes.set(row.source_id, row.content_hash);
  }
  return hashes;
}

/**
 * Upserts embedding rows into accel_embeddings.
 * ON CONFLICT on (source_table, source_id) updates existing rows in place.
 */
async function upsertEmbeddings(rows: EmbeddingRow[]): Promise<void> {
  if (rows.length === 0) return;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('accel_embeddings')
    .upsert(rows, { onConflict: 'source_table,source_id' });

  if (error) {
    throw new Error(`Failed to upsert embeddings: ${error.message}`);
  }
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

  const toEmbed = files.filter((file) => {
    const text = `${file.title}${file.description ? `: ${file.description}` : ''}`;
    return existingHashes.get(file.id) !== md5(text);
  });

  if (toEmbed.length === 0) return { source, upserted: 0, skipped: files.length };

  const texts = toEmbed.map(
    (file) => `${file.title}${file.description ? `: ${file.description}` : ''}`,
  );
  const embedded = await embedBatch(texts);

  const rows: EmbeddingRow[] = toEmbed.map((file, i) => ({
    source_table: source,
    source_id: file.id,
    content_hash: md5(texts[i]),
    embedding: embedded[i].vector,
    embedded_at: new Date().toISOString(),
  }));

  await upsertEmbeddings(rows);
  return { source, upserted: rows.length, skipped: files.length - rows.length };
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

  const toEmbed = deliverables.filter((d) => {
    const text = `${d.title} (format: ${d.expected_format})`;
    return existingHashes.get(d.id) !== md5(text);
  });

  if (toEmbed.length === 0) return { source, upserted: 0, skipped: deliverables.length };

  const texts = toEmbed.map((d) => `${d.title} (format: ${d.expected_format})`);
  const embedded = await embedBatch(texts);

  const rows: EmbeddingRow[] = toEmbed.map((d, i) => ({
    source_table: source,
    source_id: d.id,
    content_hash: md5(texts[i]),
    embedding: embedded[i].vector,
    embedded_at: new Date().toISOString(),
  }));

  await upsertEmbeddings(rows);
  return { source, upserted: rows.length, skipped: deliverables.length - rows.length };
}

async function embedSubmissions(): Promise<EmbedSourceResult> {
  const source: EmbeddingSource = 'accel_submissions';
  const supabase = createAdminClient();

  // Only embed finalized submissions — in_progress drafts are unstable
  // and empty text_content adds no signal.
  const { data: submissions, error } = await supabase
    .from('accel_submissions')
    .select('id, text_content')
    .in('status', ['submitted', 'under_review', 'approved'])
    .not('text_content', 'is', null);

  if (error) throw new Error(`Failed to fetch submissions: ${error.message}`);
  if (!submissions?.length) return { source, upserted: 0, skipped: 0 };

  const existingHashes = await fetchExistingHashes(source);

  const toEmbed = submissions.filter((s) => {
    const text = s.text_content as string;
    return existingHashes.get(s.id) !== md5(text);
  });

  if (toEmbed.length === 0) return { source, upserted: 0, skipped: submissions.length };

  const texts = toEmbed.map((s) => s.text_content as string);
  const embedded = await embedBatch(texts);

  const rows: EmbeddingRow[] = toEmbed.map((s, i) => ({
    source_table: source,
    source_id: s.id,
    content_hash: md5(texts[i]),
    embedding: embedded[i].vector,
    embedded_at: new Date().toISOString(),
  }));

  await upsertEmbeddings(rows);
  return { source, upserted: rows.length, skipped: submissions.length - rows.length };
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

  const toEmbed = meetings.filter((m) => {
    const text = m.notes as string;
    return existingHashes.get(m.id) !== md5(text);
  });

  if (toEmbed.length === 0) return { source, upserted: 0, skipped: meetings.length };

  const texts = toEmbed.map((m) => m.notes as string);
  const embedded = await embedBatch(texts);

  const rows: EmbeddingRow[] = toEmbed.map((m, i) => ({
    source_table: source,
    source_id: m.id,
    content_hash: md5(texts[i]),
    embedding: embedded[i].vector,
    embedded_at: new Date().toISOString(),
  }));

  await upsertEmbeddings(rows);
  return { source, upserted: rows.length, skipped: meetings.length - rows.length };
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

  const toEmbed = docs.filter((doc) => {
    const text = `${doc.title}\n\n${doc.content}`;
    return existingHashes.get(doc.id) !== md5(text);
  });

  if (toEmbed.length === 0) return { source, upserted: 0, skipped: docs.length };

  const texts = toEmbed.map((doc) => `${doc.title}\n\n${doc.content}`);
  const embedded = await embedBatch(texts);

  const rows: EmbeddingRow[] = toEmbed.map((doc, i) => ({
    source_table: source,
    source_id: doc.id,
    content_hash: md5(texts[i]),
    embedding: embedded[i].vector,
    embedded_at: new Date().toISOString(),
  }));

  await upsertEmbeddings(rows);
  return { source, upserted: rows.length, skipped: docs.length - rows.length };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Re-embeds all five source tables. Sources run in parallel since each
 * calls a separate Supabase table and a separate Jina batch — no shared
 * resource contention. Idempotent: unchanged rows are skipped via MD5 hash.
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

  const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

  return {
    results,
    totalUpserted,
    totalSkipped,
    durationMs: Date.now() - startTime,
  };
}
