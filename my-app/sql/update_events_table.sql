-- First, drop any existing policies
DROP POLICY IF EXISTS manage_events ON events;
DROP POLICY IF EXISTS view_approved_events ON events;

-- Add status column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approved_by column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Add approved_at column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create a function to approve/reject events
CREATE OR REPLACE FUNCTION update_event_status(event_id UUID, new_status VARCHAR(20), manager_id UUID)
RETURNS VOID AS $$
BEGIN
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: must be pending, approved, or rejected';
  END IF;
  
  -- Check if the user is a manager
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = manager_id AND is_manager = TRUE) THEN
    RAISE EXCEPTION 'Only managers can update event status';
  END IF;
  
  UPDATE events
  SET status = new_status,
      approved_by = CASE WHEN new_status = 'approved' THEN manager_id ELSE NULL END,
      approved_at = CASE WHEN new_status = 'approved' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy to ensure only managers can approve/reject events (if using RLS)
CREATE POLICY manage_events ON events
  FOR UPDATE 
  USING (
    auth.uid() IN (SELECT id FROM manager_profiles)
  );

-- Create policy to allow all users to view approved events
CREATE POLICY view_approved_events ON events
  FOR SELECT 
  USING (
    status = 'approved' OR created_by = auth.uid()
  ); 