-- ============================================================
-- Founder API Keys (for MCP server / coding agent integration)
-- Created: 2026-06-02
-- ============================================================

CREATE TABLE IF NOT EXISTS accel_api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid NOT NULL REFERENCES accel_teams(id) ON DELETE CASCADE,
  profile_id   uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  key_hash     text NOT NULL UNIQUE,
  label        text,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accel_api_keys ENABLE ROW LEVEL SECURITY;

-- Founders can only see and manage their own keys
CREATE POLICY "api_keys_owner_all"
  ON accel_api_keys FOR ALL TO authenticated
  USING (profile_id = auth.uid());

-- aggiex_team can view all keys (for auditing)
CREATE POLICY "api_keys_aggiex_select"
  ON accel_api_keys FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accel_profiles
      WHERE id = auth.uid() AND role = 'aggiex_team'
    )
  );
