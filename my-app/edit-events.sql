-- Add columns to events table for storing edited events 
-- 07/10/2025

ALTER TABLE events ADD COLUMN pending_changes JSONB;
ALTER TABLE events ADD COLUMN has_pending_changes BOOLEAN DEFAULT FALSE;