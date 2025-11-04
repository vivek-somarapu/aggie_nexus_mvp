-- Archive old inquiries (only run if you have millions of records)
-- This moves inquiries older than 2 years to a separate archive table

-- Create archive table (one-time setup)
CREATE TABLE IF NOT EXISTS public.project_applications_archive (
    LIKE public.project_applications INCLUDING ALL
);

-- Function to archive old inquiries
CREATE OR REPLACE FUNCTION archive_old_inquiries()
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move inquiries older than 2 years to archive
    WITH moved AS (
        DELETE FROM public.project_applications
        WHERE created_at < NOW() - INTERVAL '2 years'
        AND status IN ('rejected', 'accepted') -- Only archive completed inquiries
        RETURNING *
    )
    INSERT INTO public.project_applications_archive
    SELECT * FROM moved;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run monthly (Supabase pg_cron extension)
-- Uncomment if you want automatic archiving:
/*
SELECT cron.schedule(
    'archive-old-inquiries',
    '0 0 1 * *', -- Run at midnight on the 1st of every month
    $$SELECT archive_old_inquiries();$$
);
*/

-- Manual run: SELECT archive_old_inquiries();
