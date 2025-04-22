-- Add is_manager column to users table (not profiles view)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT FALSE;

-- First, drop any policies that depend on our views
DROP POLICY IF EXISTS update_manager_status ON users;

-- Then drop any views in the right order
DROP VIEW IF EXISTS manager_profiles;
DROP VIEW IF EXISTS profiles;

-- Recreate the profiles view to include the is_manager column
CREATE VIEW profiles AS
SELECT 
    id,
    full_name,
    email,
    bio,
    avatar,
    industry,
    skills,
    linkedin_url,
    website_url,
    resume_url,
    additional_links,
    views,
    graduation_year,
    is_texas_am_affiliate,
    created_at,
    updated_at,
    is_manager  -- Add the new column at the end
FROM users
WHERE deleted = false;

-- Create a view for querying manager profiles
CREATE VIEW manager_profiles AS
SELECT p.*
FROM profiles p
WHERE p.is_manager = TRUE;

-- Create a function to update user manager status
CREATE OR REPLACE FUNCTION update_user_manager_status(user_id UUID, manager_status BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET is_manager = manager_status,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy to ensure only managers can change manager status (if using RLS)
CREATE POLICY update_manager_status ON users
  FOR UPDATE 
  USING (
    (is_manager = TRUE) OR 
    (auth.uid() IN (SELECT id FROM manager_profiles))
  );

-- To set a user as manager, run:
-- SELECT update_user_manager_status('user-uuid-here', TRUE); 