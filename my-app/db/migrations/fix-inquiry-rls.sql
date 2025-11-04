-- Check current RLS policies on project_applications
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'project_applications';

-- Disable RLS temporarily to test (DON'T USE IN PRODUCTION)
-- ALTER TABLE public.project_applications DISABLE ROW LEVEL SECURITY;

-- Or create a policy that allows project owners to update read_inquiry
-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Project owners can update their project applications" ON public.project_applications;

-- Create policy allowing project owners to update inquiries
CREATE POLICY "Project owners can update their project applications"
ON public.project_applications
FOR UPDATE
USING (
  -- User is the project owner
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_applications.project_id
    AND projects.owner_id = auth.uid()
  )
)
WITH CHECK (
  -- User is the project owner
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_applications.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Also ensure project owners can read all applications for their projects
DROP POLICY IF EXISTS "Project owners can view their project applications" ON public.project_applications;

CREATE POLICY "Project owners can view their project applications"
ON public.project_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_applications.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Ensure applicants can view their own applications
DROP POLICY IF EXISTS "Users can view their own applications" ON public.project_applications;

CREATE POLICY "Users can view their own applications"
ON public.project_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure applicants can insert their own applications
DROP POLICY IF EXISTS "Users can create their own applications" ON public.project_applications;

CREATE POLICY "Users can create their own applications"
ON public.project_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);
