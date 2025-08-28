-- Migration to add required profile status tracking columns to users table

-- Check if profile_setup_skipped column exists, add if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'profile_setup_skipped') THEN
    ALTER TABLE users ADD COLUMN profile_setup_skipped BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Check if profile_setup_completed column exists, add if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'profile_setup_completed') THEN
    ALTER TABLE users ADD COLUMN profile_setup_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Check if profile_setup_skipped_at column exists, add if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'profile_setup_skipped_at') THEN
    ALTER TABLE users ADD COLUMN profile_setup_skipped_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Check if last_login_at column exists, add if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create a database function to update last_login_at on login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET last_login_at = NOW() WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Try to create trigger if it doesn't exist (this will error if users doesn't exist yet, which is fine)
DO $$ 
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS update_last_login_trigger ON auth.users;
  
  -- Try to create the trigger
  BEGIN
    CREATE TRIGGER update_last_login_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_login();
  EXCEPTION WHEN OTHERS THEN
    -- Trigger creation failed, likely because auth.users doesn't exist
    -- This is expected in some setups, so we'll just log it
    RAISE NOTICE 'Could not create auth user trigger: %', SQLERRM;
  END;
END $$; 