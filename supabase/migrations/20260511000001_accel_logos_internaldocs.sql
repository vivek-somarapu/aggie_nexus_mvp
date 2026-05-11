-- ============================================================
-- AggieX Accelerator — Startup Logos + Internal Docs
-- Created: 2026-05-11
-- ============================================================

-- ─── Startup logo ────────────────────────────────────────────

ALTER TABLE accel_teams
  ADD COLUMN IF NOT EXISTS logo_url text;

-- ─── Internal documents ──────────────────────────────────────
-- For AggieX / MCE staff documents not visible to founders.

CREATE TABLE IF NOT EXISTS accel_internal_docs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  uploader_id  uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  file_url     text NOT NULL,
  file_type    text NOT NULL DEFAULT 'other'
               CHECK (file_type IN ('pdf', 'docx', 'link', 'other')),
  -- aggiex_only: aggiex_team members only
  -- aggiex_mce:  aggiex_team + mce_staff
  visibility   text NOT NULL DEFAULT 'aggiex_mce'
               CHECK (visibility IN ('aggiex_only', 'aggiex_mce')),
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'in_review', 'approved')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accel_internal_docs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_accel_internal_docs_program_id
  ON accel_internal_docs(program_id);

-- AggieX team has full access
CREATE POLICY "internal_docs_aggiex_all"
  ON accel_internal_docs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'aggiex_team'
    )
  );

-- MCE staff can read docs shared with them
CREATE POLICY "internal_docs_mce_select"
  ON accel_internal_docs FOR SELECT TO authenticated
  USING (
    visibility = 'aggiex_mce'
    AND EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'mce_staff'
    )
  );
