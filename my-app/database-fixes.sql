-- First, let's check the table structure to determine foreign keys
-- For projects table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects';

-- For events table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'events';

-- For project_bookmarks table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'project_bookmarks';

-- For user_bookmarks table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_bookmarks';

-- After examining the results, run the appropriate CREATE INDEX statements:

-- For project_bookmarks table (assuming project_id and user_id are the foreign keys)
CREATE INDEX IF NOT EXISTS idx_project_bookmarks_project_id ON public.project_bookmarks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bookmarks_user_id ON public.project_bookmarks(user_id);

-- For user_bookmarks table (assuming user_id and bookmarked_user_id are the foreign keys)
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON public.user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_bookmarked_user_id ON public.user_bookmarks(bookmarked_user_id);

-- For events table (you'll need to identify the actual foreign key columns from the first query)
-- Example: CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- Fix RLS policies to avoid using current_setting() and auth functions
-- For users table
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;

-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public';

-- Then after examining existing policies, update them to use auth.uid() directly
-- Examples (adjust based on output of previous query):
ALTER POLICY "Users can update their own profile" ON public.users 
  USING (auth.uid() = id);

ALTER POLICY "Anyone can view non-deleted projects" ON public.projects 
  USING (deleted = false);

-- Enable RLS on tables if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;