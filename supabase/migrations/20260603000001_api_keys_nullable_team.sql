-- Allow accel_api_keys.team_id to be NULL so aggiex_team / mce_staff
-- members can generate API keys for the staff MCP server without being
-- assigned to a startup team.
ALTER TABLE accel_api_keys
  ALTER COLUMN team_id DROP NOT NULL;
