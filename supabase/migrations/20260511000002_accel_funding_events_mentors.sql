-- ============================================================
-- AggieX Accelerator — Funding Events & Mentor Profile Tables
-- Created: 2026-05-11
-- ============================================================

-- ─── Enum: fund type ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE accel_fund_type AS ENUM ('dilutive', 'non_dilutive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Table: accel_funding_events ─────────────────────────────────────────────
-- Tracks individual funding events (dilutive or non-dilutive) per team.
-- Separate from accel_milestone_funding which tracks the aggregate program award.

CREATE TABLE IF NOT EXISTS accel_funding_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  program_id    uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  fund_type     accel_fund_type NOT NULL,
  amount        numeric(14, 2) NOT NULL CHECK (amount >= 0),
  source        text NOT NULL,
  acquired_at   date NOT NULL,
  notes         text,
  logged_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS accel_funding_events_team_id_idx
  ON accel_funding_events (team_id);

CREATE INDEX IF NOT EXISTS accel_funding_events_acquired_at_idx
  ON accel_funding_events (acquired_at DESC);

-- ─── Table: accel_mentor_profiles ─────────────────────────────────────────────
-- Extended profile info for mentors: bio, expertise tags, LinkedIn, etc.

CREATE TABLE IF NOT EXISTS accel_mentor_profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      text NOT NULL,
  email          text NOT NULL,
  bio            text,
  company        text,
  title          text,
  linkedin_url   text,
  expertise_tags text[] DEFAULT '{}',
  tier           accel_mentor_tier NOT NULL DEFAULT 'domain',
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE accel_funding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_mentor_profiles ENABLE ROW LEVEL SECURITY;

-- Funding events: aggiex_team can do everything; mce_staff can read
CREATE POLICY "accel_funding_events_read" ON accel_funding_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid()
        AND role IN ('aggiex_team', 'mce_staff')
        AND is_active = true
    )
  );

CREATE POLICY "accel_funding_events_write" ON accel_funding_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid()
        AND role = 'aggiex_team'
        AND is_active = true
    )
  );

-- Mentor profiles: all active accelerator users can read; aggiex_team can write
CREATE POLICY "accel_mentor_profiles_read" ON accel_mentor_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "accel_mentor_profiles_write" ON accel_mentor_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid()
        AND role = 'aggiex_team'
        AND is_active = true
    )
  );
