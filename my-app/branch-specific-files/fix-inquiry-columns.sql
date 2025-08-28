-- Fix column names in project_application_details and project_applications tables to match code expectations
-- The code expects 'user_id' but we created 'applicant_id'

-- Fix project_application_details table
ALTER TABLE public.project_application_details 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS project_owner_id uuid,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS project_title text,
ADD COLUMN IF NOT EXISTS applicant_name text,
ADD COLUMN IF NOT EXISTS applicant_email text,
ADD COLUMN IF NOT EXISTS applicant_avatar text,
ADD COLUMN IF NOT EXISTS applicant_bio text;

-- Fix project_applications table
ALTER TABLE public.project_applications 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS note text;

-- Update the user_id column to match applicant_id for existing records in project_application_details
UPDATE public.project_application_details 
SET user_id = applicant_id 
WHERE user_id IS NULL AND applicant_id IS NOT NULL;

-- Update the user_id column to match applicant_id for existing records in project_applications
UPDATE public.project_applications 
SET user_id = applicant_id 
WHERE user_id IS NULL AND applicant_id IS NOT NULL;

-- Update project_owner_id by joining with projects table
UPDATE public.project_application_details 
SET project_owner_id = projects.owner_id
FROM public.projects 
WHERE project_application_details.project_id = projects.id 
AND project_application_details.project_owner_id IS NULL;

-- Add foreign key constraints for the new columns
DO $$ 
BEGIN
    -- project_application_details foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_application_details_user_id_fkey') THEN
        ALTER TABLE public.project_application_details ADD CONSTRAINT project_application_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_application_details_project_owner_id_fkey') THEN
        ALTER TABLE public.project_application_details ADD CONSTRAINT project_application_details_project_owner_id_fkey FOREIGN KEY (project_owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- project_applications foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_applications_user_id_fkey') THEN
        ALTER TABLE public.project_applications ADD CONSTRAINT project_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_project_application_details_user_id ON public.project_application_details USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_project_application_details_project_owner_id ON public.project_application_details USING btree (project_owner_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_user_id ON public.project_applications USING btree (user_id);

-- Add comments
COMMENT ON COLUMN public.project_application_details.user_id IS 'User who submitted the inquiry (same as applicant_id)';
COMMENT ON COLUMN public.project_application_details.project_owner_id IS 'Owner of the project being inquired about';
COMMENT ON COLUMN public.project_application_details.note IS 'Note/message from the applicant';
COMMENT ON COLUMN public.project_application_details.project_title IS 'Title of the project';
COMMENT ON COLUMN public.project_application_details.applicant_name IS 'Name of the applicant';
COMMENT ON COLUMN public.project_application_details.applicant_email IS 'Email of the applicant';
COMMENT ON COLUMN public.project_application_details.applicant_avatar IS 'Avatar URL of the applicant';
COMMENT ON COLUMN public.project_application_details.applicant_bio IS 'Bio of the applicant';

COMMENT ON COLUMN public.project_applications.user_id IS 'User who submitted the application (same as applicant_id)';
COMMENT ON COLUMN public.project_applications.note IS 'Note/message from the applicant'; 