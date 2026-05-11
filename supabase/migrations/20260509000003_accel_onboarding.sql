-- ============================================================
-- AggieX Accelerator — Onboarding & Approval Flow
-- Created: 2026-05-09
-- Adds onboarding tracking and changes new-user defaults so
-- founders and mentors require explicit AggieX approval before
-- gaining full platform access.
-- ============================================================

-- ─── Schema additions ────────────────────────────────────────

ALTER TABLE accel_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Backfill existing active users — they pre-date the onboarding flow
-- and should be treated as already onboarded.
UPDATE accel_profiles
  SET onboarding_completed_at = created_at
  WHERE is_active = true AND onboarding_completed_at IS NULL;

-- ─── Updated auth trigger ────────────────────────────────────
-- Founders and mentors start inactive (is_active = false) and
-- must be approved by an AggieX team member after onboarding.
-- AggieX / MCE staff are activated immediately on invite accept.

CREATE OR REPLACE FUNCTION handle_accel_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role      text;
  v_team_id   uuid;
  v_inviter   uuid;
  v_name      text;
  v_is_active boolean;
BEGIN
  v_role := NEW.raw_user_meta_data->>'accel_role';

  IF v_role IS NULL THEN
    RETURN NEW;
  END IF;

  v_team_id   := NULLIF(NEW.raw_user_meta_data->>'accel_team_id', '')::uuid;
  v_inviter   := NULLIF(NEW.raw_user_meta_data->>'accel_invited_by', '')::uuid;
  v_name      := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- Internal roles are trusted; founders and mentors need explicit approval.
  v_is_active := v_role IN ('aggiex_team', 'mce_staff');

  INSERT INTO accel_profiles (id, role, full_name, email, team_id, invited_by, is_active)
  VALUES (NEW.id, v_role::accel_role, v_name, NEW.email, v_team_id, v_inviter, v_is_active)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate trigger to pick up the new function body
DROP TRIGGER IF EXISTS on_accel_auth_user_created ON auth.users;

CREATE TRIGGER on_accel_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_accel_new_user();

-- ─── RLS: allow users to update their own onboarding status ──
-- Founders/mentors need to be able to mark onboarding complete
-- even before their is_active flag is set.

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own onboarding" ON accel_profiles;
  CREATE POLICY "Users can update own onboarding"
    ON accel_profiles FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- AggieX team can update any profile (for approvals)
DO $$ BEGIN
  DROP POLICY IF EXISTS "AggieX team can update any profile" ON accel_profiles;
  CREATE POLICY "AggieX team can update any profile"
    ON accel_profiles FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM accel_profiles caller
        WHERE caller.id = auth.uid() AND caller.role = 'aggiex_team'
      )
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;
