-- Add 'accel_context_docs' to the embedding source enum.
-- Must run BEFORE creating the context docs table since the embedding pipeline
-- references this enum in accel_embeddings.source_table.
ALTER TYPE accel_embedding_source ADD VALUE IF NOT EXISTS 'accel_context_docs';

-- ─── accel_context_docs ──────────────────────────────────────────────────────
-- Stores manually uploaded reference documents for the AI Advisor knowledge
-- base: program outlines, team applications, general reference material, etc.
-- Content is plain text extracted client-side from uploaded files.

CREATE TABLE IF NOT EXISTS accel_context_docs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  content       text NOT NULL,
  doc_type      text NOT NULL DEFAULT 'general'
                  CHECK (doc_type IN ('program_outline', 'team_application', 'reference', 'general')),
  team_id       uuid REFERENCES accel_teams (id) ON DELETE CASCADE,
  uploaded_by   uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  content_hash  text NOT NULL
);

-- Index for the embedding pipeline's hash-based idempotency checks.
CREATE INDEX IF NOT EXISTS accel_context_docs_hash_idx
  ON accel_context_docs (content_hash);

-- Index for team-scoped document lookups.
CREATE INDEX IF NOT EXISTS accel_context_docs_team_idx
  ON accel_context_docs (team_id)
  WHERE team_id IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE accel_context_docs ENABLE ROW LEVEL SECURITY;

-- aggiex_team members can manage all docs.
CREATE POLICY "aggiex_team full access"
  ON accel_context_docs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE accel_profiles.id = auth.uid()
        AND accel_profiles.role = 'aggiex_team'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE accel_profiles.id = auth.uid()
        AND accel_profiles.role = 'aggiex_team'
    )
  );

-- All authenticated accelerator users can read docs (needed for semantic hydration).
CREATE POLICY "accelerator users read access"
  ON accel_context_docs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE accel_profiles.id = auth.uid()
    )
  );
