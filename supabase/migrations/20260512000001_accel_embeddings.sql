-- ============================================================
-- AggieX Accelerator — pgvector Semantic Embeddings
-- Created: 2026-05-12
--
-- Stores 1024-dim Jina embeddings for curriculum files,
-- deliverables, submissions, and meeting records.
-- Enables cosine-similarity search via match_embeddings().
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Source table enum ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE accel_embedding_source AS ENUM (
    'accel_curriculum_files',
    'accel_deliverables',
    'accel_submissions',
    'accel_meeting_records'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── accel_embeddings ─────────────────────────────────────────────────────────
-- One row per source row. (source_table, source_id) is the natural key.
-- content_hash (MD5 of embedded text) lets the pipeline skip unchanged rows.

CREATE TABLE IF NOT EXISTS accel_embeddings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table  accel_embedding_source NOT NULL,
  source_id     uuid        NOT NULL,
  content_hash  text        NOT NULL,
  embedding     vector(1024) NOT NULL,
  embedded_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id)
);

-- ivfflat approximate cosine search index.
-- lists = 100 is appropriate for datasets up to ~50k rows.
CREATE INDEX IF NOT EXISTS accel_embeddings_vector_idx
  ON accel_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Active accelerator users can read. Writes are service-role only
-- (the embedding pipeline runs with SUPABASE_SERVICE_ROLE_KEY).

ALTER TABLE accel_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accel_embeddings_read" ON accel_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid()
        AND is_active = true
    )
  );

-- ─── match_embeddings() ───────────────────────────────────────────────────────
-- Returns the top match_count rows whose cosine similarity exceeds
-- match_threshold. Pass NULL for filter_source to search all tables.

CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding  vector(1024),
  match_threshold  float,
  match_count      int,
  filter_source    accel_embedding_source DEFAULT NULL
)
RETURNS TABLE (
  id            uuid,
  source_table  accel_embedding_source,
  source_id     uuid,
  similarity    float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.source_table,
    e.source_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM accel_embeddings e
  WHERE
    (filter_source IS NULL OR e.source_table = filter_source)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
