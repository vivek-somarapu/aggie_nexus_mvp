-- ============================================================
-- AggieX Accelerator Platform — Schema Migration
-- Created: 2026-05-09
-- All new tables use the accel_ prefix. Safe to run repeatedly.
-- ============================================================

-- ============================================================
-- ENUMS
-- DO blocks catch duplicate_object so re-runs are safe.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE accel_role AS ENUM ('founder', 'aggiex_team', 'mce_staff', 'mentor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_intensity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_entity_type AS ENUM ('llc', 'c_corp', 's_corp', 'none', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_crucible_outcome AS ENUM ('accelerate', 'refine', 'restructure');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_submission_status AS ENUM (
    'not_started', 'in_progress', 'submitted',
    'under_review', 'approved', 'needs_revision', 'flagged'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_expected_format AS ENUM ('file', 'text', 'link', 'any');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_submission_file_type AS ENUM ('pdf', 'docx', 'image', 'link', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_meeting_file_type AS ENUM ('image', 'pdf', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_metric_type AS ENUM (
    'revenue', 'users', 'lois', 'pilots', 'retention', 'churn', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_mentor_tier AS ENUM ('operational', 'domain', 'capital');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_assessment_type AS ENUM ('weekly', 'crucible', 'demo_day');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_meeting_type AS ENUM (
    'mentor_session', 'demo_day', 'one_on_one', 'crucible', 'speaker_session', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_curriculum_file_type AS ENUM (
    'pdf', 'docx', 'video_link', 'external_link', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_access_level AS ENUM ('all', 'founders_only', 'aggiex_internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_event_type AS ENUM (
    'week_start', 'week_end', 'demo_day', 'crucible',
    'speaker_day', 'mentor_day', 'off_day', 'one_on_one',
    'social_event', 'final_demo_day', 'program_close'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_visible_to AS ENUM ('all', 'aggiex_team', 'founders', 'mentors');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_funding_status AS ENUM ('on_track', 'paused', 'probation', 'exited');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE accel_review_visibility AS ENUM ('team', 'internal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLES
-- Created in FK dependency order to avoid forward-reference errors.
-- Circular dependencies (programs↔profiles, profiles↔teams)
-- are resolved by adding those FK constraints at the end.
-- ============================================================

-- accel_programs: one row per cohort year
-- created_by FK to accel_profiles added after that table exists
CREATE TABLE IF NOT EXISTS accel_programs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  cohort_year      int  NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  official_close_date date NOT NULL,
  is_active        boolean NOT NULL DEFAULT false,
  max_teams        int NOT NULL DEFAULT 8,
  created_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_teams: startup teams per cohort
CREATE TABLE IF NOT EXISTS accel_teams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  name             text NOT NULL,
  industry_vertical text,
  venture_stage    text,
  entity_type      accel_entity_type DEFAULT 'none',
  tamu_ip_flag     boolean NOT NULL DEFAULT false,
  beachhead_market text,
  website          text,
  pitch_deck_url   text,
  crucible_outcome accel_crucible_outcome,
  crucible_reviewed_at timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_profiles: extends auth.users, one row per platform user
-- team_id FK to accel_teams; invited_by self-reference — both added at end
CREATE TABLE IF NOT EXISTS accel_profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role             accel_role NOT NULL,
  full_name        text NOT NULL,
  email            text NOT NULL,
  team_id          uuid,
  invited_by       uuid,
  invite_accepted_at timestamptz,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_founders: individual founder detail per team
CREATE TABLE IF NOT EXISTS accel_founders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  full_name        text NOT NULL,
  email            text NOT NULL,
  role_title       text,
  equity_pct       numeric(5, 2),
  tamu_college     text,
  major            text,
  classification   text,
  expected_grad    text,
  linkedin_url     text,
  is_primary_contact boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- accel_weeks: one per week per program, pre-seeded
CREATE TABLE IF NOT EXISTS accel_weeks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  week_number      int NOT NULL CHECK (week_number BETWEEN 1 AND 10),
  theme            text NOT NULL,
  intensity        accel_intensity NOT NULL,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  demo_day_date    date,
  is_crucible      boolean NOT NULL DEFAULT false,
  is_final_demo_day boolean NOT NULL DEFAULT false,
  is_unlocked      boolean NOT NULL DEFAULT false,
  unlocked_at      timestamptz,
  unlocked_by      uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, week_number)
);

-- accel_deliverables: canonical deliverable definitions, pre-seeded
CREATE TABLE IF NOT EXISTS accel_deliverables (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id          uuid NOT NULL REFERENCES accel_weeks(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  is_required      boolean NOT NULL DEFAULT true,
  expected_format  accel_expected_format NOT NULL DEFAULT 'any',
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (week_id, title)
);

-- accel_submissions: team-specific submission of a deliverable
CREATE TABLE IF NOT EXISTS accel_submissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id   uuid NOT NULL REFERENCES accel_deliverables(id) ON DELETE CASCADE,
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  version          int NOT NULL DEFAULT 1,
  status           accel_submission_status NOT NULL DEFAULT 'not_started',
  submitted_at     timestamptz,
  submitted_by     uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  text_content     text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_submission_files: files attached to a submission
CREATE TABLE IF NOT EXISTS accel_submission_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    uuid NOT NULL REFERENCES accel_submissions(id) ON DELETE CASCADE,
  file_name        text NOT NULL,
  file_url         text NOT NULL,
  file_type        accel_submission_file_type NOT NULL DEFAULT 'other',
  uploaded_by      uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  uploaded_at      timestamptz NOT NULL DEFAULT now()
);

-- accel_reviews: score + comments on a submission
CREATE TABLE IF NOT EXISTS accel_reviews (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id    uuid NOT NULL REFERENCES accel_submissions(id) ON DELETE CASCADE,
  reviewer_id      uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  score            int CHECK (score BETWEEN 1 AND 5),
  comments         text,
  visibility       accel_review_visibility NOT NULL DEFAULT 'internal',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_traction_entries: weekly traction metrics logged by founders
CREATE TABLE IF NOT EXISTS accel_traction_entries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  week_id          uuid REFERENCES accel_weeks(id) ON DELETE SET NULL,
  entry_date       date NOT NULL,
  metric_type      accel_metric_type NOT NULL,
  value            numeric NOT NULL,
  unit             text NOT NULL,
  notes            text,
  source_evidence_url text,
  logged_by        uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_daily_reports: one per team per business day
CREATE TABLE IF NOT EXISTS accel_daily_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  author_id        uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  report_date      date NOT NULL,
  win              text NOT NULL,
  blocker          text NOT NULL,
  metrics_snapshot jsonb,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, report_date)
);

-- accel_mentor_assignments: mentor ↔ team assignment managed by aggiex_team
CREATE TABLE IF NOT EXISTS accel_mentor_assignments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id        uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  tier             accel_mentor_tier NOT NULL,
  assigned_weeks   int[],
  commitment_signed boolean NOT NULL DEFAULT false,
  commitment_signed_at timestamptz,
  notes            text,
  assigned_by      uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mentor_id, team_id)
);

-- accel_mentor_assessments: structured rubric assessment per mentor per team per week
CREATE TABLE IF NOT EXISTS accel_mentor_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id        uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  week_id          uuid NOT NULL REFERENCES accel_weeks(id) ON DELETE CASCADE,
  assessment_type  accel_assessment_type NOT NULL,
  scores           jsonb,
  qualitative_notes text,
  strengths        text,
  gaps             text,
  recommended_action accel_crucible_outcome,
  is_visible_to_team boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_meeting_records: manually entered meeting log
CREATE TABLE IF NOT EXISTS accel_meeting_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  week_id          uuid REFERENCES accel_weeks(id) ON DELETE SET NULL,
  meeting_type     accel_meeting_type NOT NULL,
  meeting_date     date NOT NULL,
  duration_minutes int,
  attendees        text[],
  notes            text,
  action_items     text[],
  logged_by        uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- accel_meeting_files: photos/files attached to meeting records
CREATE TABLE IF NOT EXISTS accel_meeting_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_record_id uuid NOT NULL REFERENCES accel_meeting_records(id) ON DELETE CASCADE,
  file_name        text NOT NULL,
  file_url         text NOT NULL,
  file_type        accel_meeting_file_type NOT NULL DEFAULT 'other',
  uploaded_by      uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  uploaded_at      timestamptz NOT NULL DEFAULT now()
);

-- accel_curriculum_files: week-linked curriculum documents
CREATE TABLE IF NOT EXISTS accel_curriculum_files (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id          uuid REFERENCES accel_weeks(id) ON DELETE SET NULL,
  program_id       uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  uploader_id      uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  file_type        accel_curriculum_file_type NOT NULL DEFAULT 'other',
  file_url         text NOT NULL,
  access_level     accel_access_level NOT NULL DEFAULT 'all',
  is_active        boolean NOT NULL DEFAULT true,
  uploaded_at      timestamptz NOT NULL DEFAULT now()
);

-- accel_program_events: the live program calendar
CREATE TABLE IF NOT EXISTS accel_program_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  week_number      int CHECK (week_number BETWEEN 1 AND 10),
  event_type       accel_event_type NOT NULL,
  event_date       date NOT NULL,
  title            text NOT NULL,
  description      text,
  is_mandatory     boolean NOT NULL DEFAULT false,
  visible_to       accel_visible_to NOT NULL DEFAULT 'all',
  created_by       uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, event_type, event_date)
);

-- accel_milestone_funding: per-team $10k non-dilutive prize tracking
CREATE TABLE IF NOT EXISTS accel_milestone_funding (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  program_id       uuid NOT NULL REFERENCES accel_programs(id) ON DELETE CASCADE,
  total_award      numeric(10, 2) NOT NULL DEFAULT 10000.00,
  amount_unlocked  numeric(10, 2) NOT NULL DEFAULT 0,
  amount_pending   numeric(10, 2) NOT NULL DEFAULT 0,
  funding_status   accel_funding_status NOT NULL DEFAULT 'on_track',
  crucible_gate_passed boolean NOT NULL DEFAULT false,
  notes            text,
  updated_by       uuid REFERENCES accel_profiles(id) ON DELETE SET NULL,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, program_id)
);

-- accel_notifications: in-app notification log
CREATE TABLE IF NOT EXISTS accel_notifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id     uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  type             text NOT NULL,
  title            text NOT NULL,
  body             text,
  is_read          boolean NOT NULL DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DEFERRED FK CONSTRAINTS
-- Resolve circular dependencies after all tables exist.
-- DO blocks make these safe to re-run.
-- ============================================================

DO $$ BEGIN
  ALTER TABLE accel_programs
    ADD CONSTRAINT fk_programs_created_by
    FOREIGN KEY (created_by) REFERENCES accel_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE accel_profiles
    ADD CONSTRAINT fk_profiles_team_id
    FOREIGN KEY (team_id) REFERENCES accel_teams(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE accel_profiles
    ADD CONSTRAINT fk_profiles_invited_by
    FOREIGN KEY (invited_by) REFERENCES accel_profiles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- AUTO-PROFILE TRIGGER
-- When aggiex_team invites a user via inviteUserByEmail(),
-- the invite call must pass user_metadata with:
--   accel_role        (required)  — e.g. 'founder'
--   accel_team_id     (optional)  — uuid of accel_teams row
--   accel_invited_by  (optional)  — uuid of inviting accel_profiles row
-- The trigger creates the accel_profiles row immediately so
-- middleware can check role on the very first login.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_accel_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role    text;
  v_team_id uuid;
  v_inviter uuid;
  v_name    text;
BEGIN
  v_role := NEW.raw_user_meta_data->>'accel_role';

  -- Only act when the invite came from the accelerator platform
  IF v_role IS NULL THEN
    RETURN NEW;
  END IF;

  v_team_id := NULLIF(NEW.raw_user_meta_data->>'accel_team_id', '')::uuid;
  v_inviter := NULLIF(NEW.raw_user_meta_data->>'accel_invited_by', '')::uuid;
  v_name    := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO accel_profiles (id, role, full_name, email, team_id, invited_by)
  VALUES (NEW.id, v_role::accel_role, v_name, NEW.email, v_team_id, v_inviter)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop and recreate so the trigger definition stays current on re-runs
DROP TRIGGER IF EXISTS on_accel_auth_user_created ON auth.users;

CREATE TRIGGER on_accel_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_accel_new_user();

-- ============================================================
-- INDEXES
-- Cover the most common JOIN and filter patterns.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_accel_profiles_team_id
  ON accel_profiles(team_id);

CREATE INDEX IF NOT EXISTS idx_accel_profiles_role
  ON accel_profiles(role);

CREATE INDEX IF NOT EXISTS idx_accel_teams_program_id
  ON accel_teams(program_id);

CREATE INDEX IF NOT EXISTS idx_accel_weeks_program_id
  ON accel_weeks(program_id);

CREATE INDEX IF NOT EXISTS idx_accel_weeks_start_date
  ON accel_weeks(start_date);

CREATE INDEX IF NOT EXISTS idx_accel_deliverables_week_id
  ON accel_deliverables(week_id);

CREATE INDEX IF NOT EXISTS idx_accel_submissions_team_id
  ON accel_submissions(team_id);

CREATE INDEX IF NOT EXISTS idx_accel_submissions_deliverable_id
  ON accel_submissions(deliverable_id);

CREATE INDEX IF NOT EXISTS idx_accel_submissions_status
  ON accel_submissions(status);

CREATE INDEX IF NOT EXISTS idx_accel_traction_team_week
  ON accel_traction_entries(team_id, week_id);

CREATE INDEX IF NOT EXISTS idx_accel_daily_reports_team_date
  ON accel_daily_reports(team_id, report_date);

CREATE INDEX IF NOT EXISTS idx_accel_mentor_assignments_mentor_id
  ON accel_mentor_assignments(mentor_id);

CREATE INDEX IF NOT EXISTS idx_accel_mentor_assignments_team_id
  ON accel_mentor_assignments(team_id);

CREATE INDEX IF NOT EXISTS idx_accel_mentor_assessments_team_week
  ON accel_mentor_assessments(team_id, week_id);

CREATE INDEX IF NOT EXISTS idx_accel_meeting_records_team_id
  ON accel_meeting_records(team_id);

CREATE INDEX IF NOT EXISTS idx_accel_curriculum_files_week_id
  ON accel_curriculum_files(week_id);

CREATE INDEX IF NOT EXISTS idx_accel_program_events_program_date
  ON accel_program_events(program_id, event_date);

CREATE INDEX IF NOT EXISTS idx_accel_notifications_recipient
  ON accel_notifications(recipient_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY
-- Every table must have RLS enabled. aggiex_team always has
-- full access. All other access is explicitly scoped.
-- ============================================================

ALTER TABLE accel_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_traction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_mentor_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_meeting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_curriculum_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_program_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_milestone_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE accel_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- SECURITY DEFINER bypasses RLS when these run, which is
-- required to avoid infinite recursion when policies on
-- accel_profiles call back into accel_profiles.
-- ============================================================

CREATE OR REPLACE FUNCTION get_accel_role()
RETURNS accel_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM accel_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_accel_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM accel_profiles WHERE id = auth.uid()
$$;

-- Returns true when the calling user is a mentor assigned to the given team
CREATE OR REPLACE FUNCTION is_mentor_for_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM accel_mentor_assignments
    WHERE mentor_id = auth.uid()
      AND team_id = p_team_id
  )
$$;

-- ============================================================
-- RLS POLICIES — accel_profiles
-- Uses helper functions to avoid recursion.
-- ============================================================

-- aggiex_team and mce_staff see all profiles
CREATE POLICY "profiles_select_privileged"
  ON accel_profiles FOR SELECT TO authenticated
  USING (get_accel_role() IN ('aggiex_team', 'mce_staff'));

-- Every user sees their own profile
CREATE POLICY "profiles_select_own"
  ON accel_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Founders see profiles of teammates on the same team
CREATE POLICY "profiles_select_same_team"
  ON accel_profiles FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id IS NOT NULL
    AND team_id = get_accel_team_id()
  );

-- Mentors see profiles of founders on their assigned teams
CREATE POLICY "profiles_select_mentor_assigned"
  ON accel_profiles FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND team_id IS NOT NULL
    AND is_mentor_for_team(team_id)
  );

-- aggiex_team can update any profile (role management, deactivation)
CREATE POLICY "profiles_update_aggiex_team"
  ON accel_profiles FOR UPDATE TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

-- Users can update their own non-role fields
CREATE POLICY "profiles_update_own"
  ON accel_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT is handled by the trigger (service role); no user-facing INSERT policy

-- ============================================================
-- RLS POLICIES — accel_programs
-- ============================================================

-- All authenticated platform members can read programs
CREATE POLICY "programs_select_all"
  ON accel_programs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "programs_all_aggiex_team"
  ON accel_programs FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

-- ============================================================
-- RLS POLICIES — accel_teams
-- ============================================================

CREATE POLICY "teams_all_aggiex_team"
  ON accel_teams FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "teams_select_mce_staff"
  ON accel_teams FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Founders see only their own team
CREATE POLICY "teams_select_founder"
  ON accel_teams FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND id = get_accel_team_id()
  );

-- Mentors see their assigned teams
CREATE POLICY "teams_select_mentor"
  ON accel_teams FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(id)
  );

-- ============================================================
-- RLS POLICIES — accel_founders
-- ============================================================

CREATE POLICY "founders_all_aggiex_team"
  ON accel_founders FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "founders_select_mce_staff"
  ON accel_founders FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "founders_select_own_team"
  ON accel_founders FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

CREATE POLICY "founders_select_mentor"
  ON accel_founders FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  );

-- ============================================================
-- RLS POLICIES — accel_weeks
-- ============================================================

CREATE POLICY "weeks_all_aggiex_team"
  ON accel_weeks FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "weeks_select_mce_staff"
  ON accel_weeks FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Founders and mentors only see unlocked weeks
CREATE POLICY "weeks_select_unlocked"
  ON accel_weeks FOR SELECT TO authenticated
  USING (
    get_accel_role() IN ('founder', 'mentor')
    AND is_unlocked = true
  );

-- ============================================================
-- RLS POLICIES — accel_deliverables
-- ============================================================

CREATE POLICY "deliverables_all_aggiex_team"
  ON accel_deliverables FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "deliverables_select_mce_staff"
  ON accel_deliverables FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Founders see deliverables for unlocked weeks only
CREATE POLICY "deliverables_select_founder"
  ON accel_deliverables FOR SELECT TO authenticated
  USING (
    get_accel_role() IN ('founder', 'mentor')
    AND EXISTS (
      SELECT 1 FROM accel_weeks
      WHERE id = accel_deliverables.week_id
        AND is_unlocked = true
    )
  );

-- ============================================================
-- RLS POLICIES — accel_submissions
-- ============================================================

CREATE POLICY "submissions_all_aggiex_team"
  ON accel_submissions FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "submissions_select_mce_staff"
  ON accel_submissions FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "submissions_all_founder_own_team"
  ON accel_submissions FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

CREATE POLICY "submissions_select_mentor"
  ON accel_submissions FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  );

-- ============================================================
-- RLS POLICIES — accel_submission_files
-- ============================================================

CREATE POLICY "submission_files_all_aggiex_team"
  ON accel_submission_files FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "submission_files_select_mce_staff"
  ON accel_submission_files FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "submission_files_all_founder"
  ON accel_submission_files FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND EXISTS (
      SELECT 1 FROM accel_submissions s
      WHERE s.id = accel_submission_files.submission_id
        AND s.team_id = get_accel_team_id()
    )
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND EXISTS (
      SELECT 1 FROM accel_submissions s
      WHERE s.id = accel_submission_files.submission_id
        AND s.team_id = get_accel_team_id()
    )
  );

CREATE POLICY "submission_files_select_mentor"
  ON accel_submission_files FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND EXISTS (
      SELECT 1 FROM accel_submissions s
      WHERE s.id = accel_submission_files.submission_id
        AND is_mentor_for_team(s.team_id)
    )
  );

-- ============================================================
-- RLS POLICIES — accel_reviews
-- ============================================================

CREATE POLICY "reviews_all_aggiex_team"
  ON accel_reviews FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

-- mce_staff can read + write reviews
CREATE POLICY "reviews_all_mce_staff"
  ON accel_reviews FOR ALL TO authenticated
  USING (get_accel_role() = 'mce_staff')
  WITH CHECK (get_accel_role() = 'mce_staff');

-- Founders see reviews on their team's submissions where visibility = 'team'
CREATE POLICY "reviews_select_founder_team_visible"
  ON accel_reviews FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND visibility = 'team'
    AND EXISTS (
      SELECT 1 FROM accel_submissions s
      WHERE s.id = accel_reviews.submission_id
        AND s.team_id = get_accel_team_id()
    )
  );

-- Mentors see team-visible reviews on their assigned teams
CREATE POLICY "reviews_select_mentor"
  ON accel_reviews FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND visibility = 'team'
    AND EXISTS (
      SELECT 1 FROM accel_submissions s
      WHERE s.id = accel_reviews.submission_id
        AND is_mentor_for_team(s.team_id)
    )
  );

-- ============================================================
-- RLS POLICIES — accel_traction_entries
-- ============================================================

CREATE POLICY "traction_all_aggiex_team"
  ON accel_traction_entries FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "traction_select_mce_staff"
  ON accel_traction_entries FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "traction_all_founder_own_team"
  ON accel_traction_entries FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

CREATE POLICY "traction_select_mentor"
  ON accel_traction_entries FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  );

-- ============================================================
-- RLS POLICIES — accel_daily_reports
-- ============================================================

CREATE POLICY "daily_reports_all_aggiex_team"
  ON accel_daily_reports FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "daily_reports_select_mce_staff"
  ON accel_daily_reports FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "daily_reports_all_founder_own_team"
  ON accel_daily_reports FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

CREATE POLICY "daily_reports_select_mentor"
  ON accel_daily_reports FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  );

-- ============================================================
-- RLS POLICIES — accel_mentor_assignments
-- ============================================================

CREATE POLICY "mentor_assignments_all_aggiex_team"
  ON accel_mentor_assignments FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "mentor_assignments_select_mce_staff"
  ON accel_mentor_assignments FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Mentors see their own assignments
CREATE POLICY "mentor_assignments_select_own_mentor"
  ON accel_mentor_assignments FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND mentor_id = auth.uid()
  );

-- Founders see mentor assignments for their team
CREATE POLICY "mentor_assignments_select_founder"
  ON accel_mentor_assignments FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

-- ============================================================
-- RLS POLICIES — accel_mentor_assessments
-- ============================================================

CREATE POLICY "assessments_all_aggiex_team"
  ON accel_mentor_assessments FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "assessments_select_mce_staff"
  ON accel_mentor_assessments FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Mentors can read and write their own assessments
CREATE POLICY "assessments_all_own_mentor"
  ON accel_mentor_assessments FOR ALL TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND mentor_id = auth.uid()
  )
  WITH CHECK (
    get_accel_role() = 'mentor'
    AND mentor_id = auth.uid()
  );

-- Founders see assessments on their team that have been shared
CREATE POLICY "assessments_select_founder_shared"
  ON accel_mentor_assessments FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
    AND is_visible_to_team = true
  );

-- ============================================================
-- RLS POLICIES — accel_meeting_records
-- ============================================================

CREATE POLICY "meetings_all_aggiex_team"
  ON accel_meeting_records FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "meetings_select_mce_staff"
  ON accel_meeting_records FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "meetings_all_founder_own_team"
  ON accel_meeting_records FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

-- Mentors can read + create meetings for their teams
CREATE POLICY "meetings_all_mentor_assigned"
  ON accel_meeting_records FOR ALL TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  )
  WITH CHECK (
    get_accel_role() = 'mentor'
    AND is_mentor_for_team(team_id)
  );

-- ============================================================
-- RLS POLICIES — accel_meeting_files
-- ============================================================

CREATE POLICY "meeting_files_all_aggiex_team"
  ON accel_meeting_files FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "meeting_files_select_mce_staff"
  ON accel_meeting_files FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

CREATE POLICY "meeting_files_all_founder"
  ON accel_meeting_files FOR ALL TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND EXISTS (
      SELECT 1 FROM accel_meeting_records m
      WHERE m.id = accel_meeting_files.meeting_record_id
        AND m.team_id = get_accel_team_id()
    )
  )
  WITH CHECK (
    get_accel_role() = 'founder'
    AND EXISTS (
      SELECT 1 FROM accel_meeting_records m
      WHERE m.id = accel_meeting_files.meeting_record_id
        AND m.team_id = get_accel_team_id()
    )
  );

CREATE POLICY "meeting_files_all_mentor"
  ON accel_meeting_files FOR ALL TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND EXISTS (
      SELECT 1 FROM accel_meeting_records m
      WHERE m.id = accel_meeting_files.meeting_record_id
        AND is_mentor_for_team(m.team_id)
    )
  )
  WITH CHECK (
    get_accel_role() = 'mentor'
    AND EXISTS (
      SELECT 1 FROM accel_meeting_records m
      WHERE m.id = accel_meeting_files.meeting_record_id
        AND is_mentor_for_team(m.team_id)
    )
  );

-- ============================================================
-- RLS POLICIES — accel_curriculum_files
-- ============================================================

CREATE POLICY "curriculum_all_aggiex_team"
  ON accel_curriculum_files FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

-- mce_staff sees all files
CREATE POLICY "curriculum_select_mce_staff"
  ON accel_curriculum_files FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Founders see active, non-internal files for unlocked weeks
CREATE POLICY "curriculum_select_founder"
  ON accel_curriculum_files FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND is_active = true
    AND access_level IN ('all', 'founders_only')
    AND (
      week_id IS NULL  -- program-wide resources
      OR EXISTS (
        SELECT 1 FROM accel_weeks w
        WHERE w.id = accel_curriculum_files.week_id
          AND w.is_unlocked = true
      )
    )
  );

-- Mentors see active, non-internal files for unlocked weeks
CREATE POLICY "curriculum_select_mentor"
  ON accel_curriculum_files FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND is_active = true
    AND access_level IN ('all', 'founders_only')
    AND (
      week_id IS NULL
      OR EXISTS (
        SELECT 1 FROM accel_weeks w
        WHERE w.id = accel_curriculum_files.week_id
          AND w.is_unlocked = true
      )
    )
  );

-- mce_staff can upload curriculum files
CREATE POLICY "curriculum_insert_mce_staff"
  ON accel_curriculum_files FOR INSERT TO authenticated
  WITH CHECK (get_accel_role() = 'mce_staff');

-- ============================================================
-- RLS POLICIES — accel_program_events
-- ============================================================

CREATE POLICY "events_all_aggiex_team"
  ON accel_program_events FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

-- Everyone sees events targeted to 'all'
CREATE POLICY "events_select_all_visible"
  ON accel_program_events FOR SELECT TO authenticated
  USING (
    visible_to = 'all'
    AND get_accel_role() IS NOT NULL
  );

-- Founders see founder-targeted events
CREATE POLICY "events_select_founders"
  ON accel_program_events FOR SELECT TO authenticated
  USING (
    visible_to = 'founders'
    AND get_accel_role() = 'founder'
  );

-- Mentors see mentor-targeted events
CREATE POLICY "events_select_mentors"
  ON accel_program_events FOR SELECT TO authenticated
  USING (
    visible_to = 'mentors'
    AND get_accel_role() = 'mentor'
  );

-- mce_staff reads all events
CREATE POLICY "events_select_mce_staff"
  ON accel_program_events FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- ============================================================
-- RLS POLICIES — accel_milestone_funding
-- ============================================================

CREATE POLICY "funding_all_aggiex_team"
  ON accel_milestone_funding FOR ALL TO authenticated
  USING (get_accel_role() = 'aggiex_team')
  WITH CHECK (get_accel_role() = 'aggiex_team');

CREATE POLICY "funding_select_mce_staff"
  ON accel_milestone_funding FOR SELECT TO authenticated
  USING (get_accel_role() = 'mce_staff');

-- Founders see their own team's funding status
CREATE POLICY "funding_select_founder_own_team"
  ON accel_milestone_funding FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND team_id = get_accel_team_id()
  );

-- ============================================================
-- RLS POLICIES — accel_notifications
-- ============================================================

-- Each user sees only their own notifications
CREATE POLICY "notifications_select_own"
  ON accel_notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_own"
  ON accel_notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- aggiex_team can insert notifications for any recipient (system use)
CREATE POLICY "notifications_insert_aggiex_team"
  ON accel_notifications FOR INSERT TO authenticated
  WITH CHECK (get_accel_role() = 'aggiex_team');
