-- Add archived flag to inquiries (soft delete approach)
-- This keeps data but marks it as "archived" for UI filtering

-- Add archived column
ALTER TABLE public.project_applications 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_applications_archived 
ON public.project_applications(archived) WHERE archived = FALSE;

-- Function to mark old inquiries as archived
CREATE OR REPLACE FUNCTION mark_old_inquiries_archived()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE public.project_applications
    SET archived = TRUE
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status IN ('rejected', 'accepted')
    AND archived = FALSE;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- To run: SELECT mark_old_inquiries_archived();
