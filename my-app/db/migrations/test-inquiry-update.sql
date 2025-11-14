-- Test updating read_inquiry directly
-- Replace 'YOUR_INQUIRY_ID' with an actual inquiry ID from your database

-- First, check the current state
SELECT id, user_id, project_id, status, read_inquiry, created_at
FROM public.project_applications
WHERE id = 'YOUR_INQUIRY_ID';

-- Try to update it
UPDATE public.project_applications
SET read_inquiry = true
WHERE id = 'YOUR_INQUIRY_ID';

-- Check if it was updated
SELECT id, user_id, project_id, status, read_inquiry, created_at
FROM public.project_applications
WHERE id = 'YOUR_INQUIRY_ID';

-- If the above doesn't work, check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'project_applications';
