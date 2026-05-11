-- Migration: add team-level targeting to deliverables and curriculum files
-- assigned_team_ids = NULL  → visible to all eligible teams (existing default behaviour)
-- assigned_team_ids = '{uuid,...}' → visible only to those specific teams

-- ─── accel_deliverables ──────────────────────────────────────────────────────

ALTER TABLE accel_deliverables
  ADD COLUMN IF NOT EXISTS assigned_team_ids uuid[] DEFAULT NULL;

-- Drop the old combined founder+mentor policy and replace with targeted versions
DROP POLICY IF EXISTS "deliverables_select_founder" ON accel_deliverables;

-- Founders see deliverables for unlocked weeks that target their team (or all teams)
CREATE POLICY "deliverables_select_founder"
  ON accel_deliverables FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
    AND EXISTS (
      SELECT 1 FROM accel_weeks
      WHERE id = accel_deliverables.week_id
        AND is_unlocked = true
    )
    AND (
      assigned_team_ids IS NULL
      OR get_accel_team_id() = ANY(assigned_team_ids)
    )
  );

-- Mentors see deliverables for unlocked weeks that target any of their assigned teams
CREATE POLICY "deliverables_select_mentor"
  ON accel_deliverables FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'mentor'
    AND EXISTS (
      SELECT 1 FROM accel_weeks
      WHERE id = accel_deliverables.week_id
        AND is_unlocked = true
    )
    AND (
      assigned_team_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM accel_mentor_assignments ma
        WHERE ma.mentor_id = auth.uid()
          AND ma.team_id = ANY(accel_deliverables.assigned_team_ids)
      )
    )
  );

-- ─── accel_curriculum_files ───────────────────────────────────────────────────

ALTER TABLE accel_curriculum_files
  ADD COLUMN IF NOT EXISTS assigned_team_ids uuid[] DEFAULT NULL;

-- Drop old combined founder+mentor policies and replace with targeted versions
DROP POLICY IF EXISTS "curriculum_select_founder" ON accel_curriculum_files;
DROP POLICY IF EXISTS "curriculum_select_mentor"  ON accel_curriculum_files;

-- Founders see active, non-internal curriculum for unlocked weeks that target their team
CREATE POLICY "curriculum_select_founder"
  ON accel_curriculum_files FOR SELECT TO authenticated
  USING (
    get_accel_role() = 'founder'
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
    AND (
      assigned_team_ids IS NULL
      OR get_accel_team_id() = ANY(assigned_team_ids)
    )
  );

-- Mentors see active, non-internal curriculum for unlocked weeks that target their assigned teams
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
    AND (
      assigned_team_ids IS NULL
      OR EXISTS (
        SELECT 1 FROM accel_mentor_assignments ma
        WHERE ma.mentor_id = auth.uid()
          AND ma.team_id = ANY(accel_curriculum_files.assigned_team_ids)
      )
    )
  );
