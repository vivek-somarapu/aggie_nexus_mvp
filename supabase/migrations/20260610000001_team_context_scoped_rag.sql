-- ============================================================
-- AggieX Accelerator — Team-Scoped RAG + Team Context
-- Created: 2026-06-10
--
-- Changes:
--   1. Add team_id to accel_embeddings for content scoping
--   2. Backfill team_id for submissions and meeting records
--   3. Extend accel_embedding_source enum with two new values
--   4. Create accel_team_context (per-team company knowledge)
--   5. Create accel_cohort_lessons (abstracted, shared insights)
--   6. Replace match_embeddings_hybrid() with team-scoped version
-- ============================================================

-- ─── 1. Add team_id to accel_embeddings ──────────────────────────────────────
-- NULL = shared content (curriculum, deliverables, context docs, cohort lessons)
-- Non-NULL = private content scoped to one team

ALTER TABLE accel_embeddings
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES accel_teams(id) ON DELETE SET NULL;

-- ─── 2. Backfill team_id for team-scoped source tables ───────────────────────

UPDATE accel_embeddings e
SET team_id = s.team_id
FROM accel_submissions s
WHERE e.source_table = 'accel_submissions'
  AND e.source_id = s.id
  AND e.team_id IS NULL;

UPDATE accel_embeddings e
SET team_id = mr.team_id
FROM accel_meeting_records mr
WHERE e.source_table = 'accel_meeting_records'
  AND e.source_id = mr.id
  AND e.team_id IS NULL;

-- ─── 3. Extend accel_embedding_source enum ───────────────────────────────────

ALTER TYPE accel_embedding_source ADD VALUE IF NOT EXISTS 'accel_team_context';
ALTER TYPE accel_embedding_source ADD VALUE IF NOT EXISTS 'accel_cohort_lessons';

-- ─── 4. accel_team_context ────────────────────────────────────────────────────
-- Stores per-team structured company knowledge (ICP, market hypothesis, etc.).
-- (team_id, context_key) is unique — upserts overwrite the previous value.
-- updated_by = accountability ('founder' | 'aggiex_team')
-- source     = mechanism ('direct_input' | 'ai_advisor' | 'mcp' | 'deliverable_submission' | 'meeting_notes')

CREATE TABLE IF NOT EXISTS accel_team_context (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  context_key text        NOT NULL,
  content     text        NOT NULL,
  updated_by  text        NOT NULL CHECK (updated_by IN ('founder', 'aggiex_team')),
  source      text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, context_key)
);

ALTER TABLE accel_team_context ENABLE ROW LEVEL SECURITY;

-- Founders: read only their own team's context rows
CREATE POLICY "team_context_self_read" ON accel_team_context
  FOR SELECT USING (
    team_id = (
      SELECT team_id FROM accel_profiles
      WHERE id = auth.uid() AND is_active = true
      LIMIT 1
    )
  );

-- Staff and mentors: read all teams' context
CREATE POLICY "team_context_staff_read" ON accel_team_context
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid()
        AND role IN ('aggiex_team', 'mce_staff', 'mentor')
        AND is_active = true
    )
  );

-- ─── 5. accel_cohort_lessons ──────────────────────────────────────────────────
-- Abstracted insights derived from accel_team_context by LLM.
-- Team-identifying details are stripped before storage.
-- content_hash prevents duplicate lessons from accumulating.
-- team_id is always NULL — these rows belong to the shared embedding pool.

CREATE TABLE IF NOT EXISTS accel_cohort_lessons (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_text  text        NOT NULL,
  context_key  text,
  content_hash text        NOT NULL UNIQUE,
  derived_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accel_cohort_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cohort_lessons_read" ON accel_cohort_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- ─── 6. Replace match_embeddings_hybrid with team-scoped version ──────────────
-- p_team_id IS NOT NULL → return that team's private rows + shared rows (team_id IS NULL)
-- p_team_id IS NULL     → no filter, return all rows (staff use case)

CREATE OR REPLACE FUNCTION match_embeddings_hybrid(
  query_embedding  vector(1024),
  query_text       text,
  match_count      int   DEFAULT 15,
  rrf_k            int   DEFAULT 60,
  p_team_id        uuid  DEFAULT NULL
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
    WHERE (p_team_id IS NULL OR e.team_id = p_team_id OR e.team_id IS NULL)
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
      AND (p_team_id IS NULL OR e.team_id = p_team_id OR e.team_id IS NULL)
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
