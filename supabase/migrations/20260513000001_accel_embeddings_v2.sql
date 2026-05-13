-- ============================================================
-- AggieX Accelerator — Embeddings v2: Chunking + Hybrid Search
-- Created: 2026-05-13
--
-- Upgrades accel_embeddings for:
--   1. Document chunking (one row per chunk, not per document)
--   2. Stored chunk text (no separate hydration queries)
--   3. BM25 full-text search via tsvector generated column
--   4. Hybrid search via match_embeddings_hybrid() using RRF
--
-- Also adds source_url to accel_context_docs for URL-fetched docs.
-- ============================================================

-- ─── Extend accel_context_docs with optional source URL ──────────────────────

ALTER TABLE accel_context_docs
  ADD COLUMN IF NOT EXISTS source_url text;

-- ─── Add chunk columns to accel_embeddings ───────────────────────────────────
-- chunk_index: 0-based position within the source document
-- chunk_text:  the actual text of this chunk (replaces hydration queries)

ALTER TABLE accel_embeddings
  ADD COLUMN IF NOT EXISTS chunk_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chunk_text  text    NOT NULL DEFAULT '';

-- Generated tsvector for BM25 full-text search.
-- STORED means Postgres maintains it automatically on insert/update.
ALTER TABLE accel_embeddings
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce(chunk_text, ''))) STORED;

-- ─── Replace unique constraint ────────────────────────────────────────────────
-- Old: (source_table, source_id)        — one row per document
-- New: (source_table, source_id, chunk_index) — one row per chunk

ALTER TABLE accel_embeddings
  DROP CONSTRAINT IF EXISTS accel_embeddings_source_table_source_id_key;

DO $$ BEGIN
  ALTER TABLE accel_embeddings
    ADD CONSTRAINT accel_embeddings_source_chunk_unique
      UNIQUE (source_table, source_id, chunk_index);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── GIN index for full-text search ──────────────────────────────────────────
-- Session-level SET so it takes effect in autocommit mode (Supabase SQL editor).

SET maintenance_work_mem = '64MB';

CREATE INDEX IF NOT EXISTS accel_embeddings_search_vector_idx
  ON accel_embeddings
  USING GIN (search_vector);

-- Reset to a safe default after the index build.
SET maintenance_work_mem = '32MB';

-- ─── Drop old match_embeddings() ─────────────────────────────────────────────

DROP FUNCTION IF EXISTS match_embeddings(vector(1024), float, int, accel_embedding_source);

-- ─── match_embeddings_hybrid() ───────────────────────────────────────────────
-- Combines cosine vector similarity with BM25 full-text ranking using
-- Reciprocal Rank Fusion (RRF, k=60). Returns the top match_count chunks by
-- combined score, with chunk_text stored directly — no hydration needed.

CREATE OR REPLACE FUNCTION match_embeddings_hybrid(
  query_embedding  vector(1024),
  query_text       text,
  match_count      int  DEFAULT 15,
  rrf_k            int  DEFAULT 60
)
RETURNS TABLE (
  source_table  accel_embedding_source,
  source_id     uuid,
  chunk_index   integer,
  chunk_text    text,
  rrf_score     float
)
LANGUAGE sql STABLE
AS $$
  WITH vector_ranked AS (
    SELECT
      e.source_table,
      e.source_id,
      e.chunk_index,
      e.chunk_text,
      ROW_NUMBER() OVER (ORDER BY e.embedding <=> query_embedding) AS rank_vec
    FROM accel_embeddings e
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count * 3
  ),
  bm25_ranked AS (
    SELECT
      e.source_table,
      e.source_id,
      e.chunk_index,
      e.chunk_text,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(e.search_vector, websearch_to_tsquery('english', query_text)) DESC
      ) AS rank_bm25
    FROM accel_embeddings e
    WHERE e.search_vector @@ websearch_to_tsquery('english', query_text)
    LIMIT match_count * 3
  ),
  combined AS (
    SELECT
      COALESCE(v.source_table, b.source_table) AS source_table,
      COALESCE(v.source_id,    b.source_id)    AS source_id,
      COALESCE(v.chunk_index,  b.chunk_index)  AS chunk_index,
      COALESCE(v.chunk_text,   b.chunk_text)   AS chunk_text,
      COALESCE(1.0 / (rrf_k + v.rank_vec),  0) +
      COALESCE(1.0 / (rrf_k + b.rank_bm25), 0) AS rrf_score
    FROM vector_ranked v
    FULL OUTER JOIN bm25_ranked b
      ON  v.source_table = b.source_table
      AND v.source_id    = b.source_id
      AND v.chunk_index  = b.chunk_index
  )
  SELECT
    source_table,
    source_id,
    chunk_index,
    chunk_text,
    rrf_score
  FROM combined
  ORDER BY rrf_score DESC
  LIMIT match_count;
$$;
