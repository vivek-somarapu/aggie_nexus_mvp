-- The original schema defined is_active DEFAULT false for accel_teams, which
-- meant every team inserted without an explicit flag was invisible to the AI
-- Advisor and other queries that filter on is_active = true.
--
-- Fix: flip the default to true (inactive is the exception, not the norm)
-- and activate all existing teams that were never explicitly deactivated.

ALTER TABLE accel_teams
  ALTER COLUMN is_active SET DEFAULT true;

-- Activate every team that still has the false default. Teams that were
-- deliberately set to false by a staff member are left untouched.
UPDATE accel_teams
SET is_active = true
WHERE is_active = false;
