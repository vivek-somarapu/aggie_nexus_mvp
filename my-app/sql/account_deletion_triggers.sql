-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if the user metadata has been marked as deleted
  IF NEW.raw_user_meta_data->>'deleted' = 'true' THEN
    user_id := NEW.id;
    
    -- Add cascading deletion for user data here
    -- These are examples - customize based on your schema
    -- DELETE FROM projects WHERE user_id = user_id;
    -- DELETE FROM posts WHERE user_id = user_id;
    -- DELETE FROM comments WHERE user_id = user_id;
    -- DELETE FROM messages WHERE sender_id = user_id OR recipient_id = user_id;
    -- DELETE FROM notifications WHERE user_id = user_id;
    
    -- Anonymize user data that you want to keep for analytics or integrity
    -- Update instead of delete for data you need to maintain relationships
    -- UPDATE posts SET content = '[Deleted]', user_id = NULL WHERE user_id = user_id;
    
    -- Schedule the actual user deletion for later (optional)
    -- This allows you to implement a grace period
    -- INSERT INTO scheduled_deletions (user_id, scheduled_at) 
    -- VALUES (user_id, NOW() + INTERVAL '30 days');
    
    -- Log the deletion event
    -- INSERT INTO audit_logs (action, user_id, timestamp, details)
    -- VALUES ('account_deletion', user_id, NOW(), 'User account marked for deletion');
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the handle_user_deletion function (for API use)
CREATE OR REPLACE FUNCTION create_handle_user_deletion_function()
RETURNS VOID AS $$
BEGIN
  -- This is just a wrapper to allow calling via RPC
  -- The actual function is defined above
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to run on user updates
CREATE OR REPLACE FUNCTION create_user_deletion_trigger()
RETURNS VOID AS $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS on_user_deletion ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_user_deletion
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Add a cron job to process final deletions
-- This would require pg_cron extension to be enabled
-- CREATE OR REPLACE FUNCTION process_scheduled_deletions()
-- RETURNS VOID AS $$
-- BEGIN
--   DELETE FROM scheduled_deletions 
--   WHERE scheduled_at <= NOW();
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (adjust as needed for your RLS setup)
GRANT EXECUTE ON FUNCTION handle_user_deletion() TO service_role;
GRANT EXECUTE ON FUNCTION create_handle_user_deletion_function() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_deletion_trigger() TO authenticated; 