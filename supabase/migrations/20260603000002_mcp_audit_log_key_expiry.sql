-- Audit log for all MCP write-tool calls (staff and founder)
CREATE TABLE accel_mcp_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  key_id       uuid REFERENCES accel_api_keys(id) ON DELETE SET NULL,
  tool_name    text NOT NULL,
  args         jsonb,
  result       text,
  is_error     boolean NOT NULL DEFAULT false,
  called_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX accel_mcp_audit_log_profile_id_idx ON accel_mcp_audit_log(profile_id);
CREATE INDEX accel_mcp_audit_log_called_at_idx  ON accel_mcp_audit_log(called_at DESC);

-- Key expiry: API keys expire at program end by default (Aug 7 2026)
ALTER TABLE accel_api_keys
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT '2026-08-07T23:59:59Z';
