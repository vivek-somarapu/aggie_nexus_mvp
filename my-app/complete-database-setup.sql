-- Complete Database Setup for Aggie Nexus MVP
-- This script creates all necessary tables, columns, and includes gamification features
-- Updated to handle existing tables and avoid conflicts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Create utility functions
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add missing columns to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS funding_raised DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS organizations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_setup_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_setup_skipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false;

-- Add missing columns to existing projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS funding_received DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS incubator_accelerator TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS organizations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technical_requirements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_requirements TEXT[] DEFAULT '{}';

-- Add missing columns to existing events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS max_participants integer,
ADD COLUMN IF NOT EXISTS current_participants integer DEFAULT 0;

-- Create rsvps table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create project_application_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_application_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    applicant_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create project_inquiries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_inquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    inquirer_id uuid NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create project_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    applicant_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    cover_letter text,
    resume_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add primary keys only if they don't exist
DO $$ 
BEGIN
    -- Add primary key to rsvps if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rsvps_pkey') THEN
        ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_pkey PRIMARY KEY (id);
    END IF;
    
    -- Add primary key to project_application_details if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_application_details_pkey') THEN
        ALTER TABLE public.project_application_details ADD CONSTRAINT project_application_details_pkey PRIMARY KEY (id);
    END IF;
    
    -- Add primary key to project_inquiries if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_inquiries_pkey') THEN
        ALTER TABLE public.project_inquiries ADD CONSTRAINT project_inquiries_pkey PRIMARY KEY (id);
    END IF;
    
    -- Add primary key to project_applications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_applications_pkey') THEN
        ALTER TABLE public.project_applications ADD CONSTRAINT project_applications_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- RSVPs foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rsvps_user_id_fkey') THEN
        ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rsvps_event_id_fkey') THEN
        ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
    END IF;
    
    -- Project application details foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_application_details_project_id_fkey') THEN
        ALTER TABLE public.project_application_details ADD CONSTRAINT project_application_details_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_application_details_applicant_id_fkey') THEN
        ALTER TABLE public.project_application_details ADD CONSTRAINT project_application_details_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Project inquiries foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_inquiries_project_id_fkey') THEN
        ALTER TABLE public.project_inquiries ADD CONSTRAINT project_inquiries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_inquiries_inquirer_id_fkey') THEN
        ALTER TABLE public.project_inquiries ADD CONSTRAINT project_inquiries_inquirer_id_fkey FOREIGN KEY (inquirer_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Project applications foreign keys
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_applications_project_id_fkey') THEN
        ALTER TABLE public.project_applications ADD CONSTRAINT project_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_applications_applicant_id_fkey') THEN
        ALTER TABLE public.project_applications ADD CONSTRAINT project_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rsvps_user_event_unique') THEN
        ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_user_event_unique UNIQUE (user_id, event_id);
    END IF;
END $$;

-- Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_industry ON public.users USING gin (industry);
CREATE INDEX IF NOT EXISTS idx_users_skills ON public.users USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_users_organizations ON public.users USING gin (organizations);
CREATE INDEX IF NOT EXISTS idx_users_achievements ON public.users USING gin (achievements);
CREATE INDEX IF NOT EXISTS idx_users_technical_skills ON public.users USING gin (technical_skills);
CREATE INDEX IF NOT EXISTS idx_users_soft_skills ON public.users USING gin (soft_skills);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects USING btree (owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_industry ON public.projects USING gin (industry);
CREATE INDEX IF NOT EXISTS idx_projects_required_skills ON public.projects USING gin (required_skills);
CREATE INDEX IF NOT EXISTS idx_projects_organizations ON public.projects USING gin (organizations);
CREATE INDEX IF NOT EXISTS idx_projects_incubator_accelerator ON public.projects USING gin (incubator_accelerator);

CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events USING btree (status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events USING btree (start_time);

CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON public.rsvps USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON public.rsvps USING btree (status);

CREATE INDEX IF NOT EXISTS idx_project_application_details_project_id ON public.project_application_details USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_application_details_applicant_id ON public.project_application_details USING btree (applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_application_details_status ON public.project_application_details USING btree (status);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_project_id ON public.project_inquiries USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_inquirer_id ON public.project_inquiries USING btree (inquirer_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_status ON public.project_inquiries USING btree (status);

CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON public.project_applications USING btree (applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications USING btree (status);

-- Add triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
        CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_projects_updated_at') THEN
        CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_events_updated_at') THEN
        CREATE TRIGGER set_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_rsvps_updated_at') THEN
        CREATE TRIGGER set_rsvps_updated_at BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_project_application_details_updated_at') THEN
        CREATE TRIGGER set_project_application_details_updated_at BEFORE UPDATE ON public.project_application_details FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_project_inquiries_updated_at') THEN
        CREATE TRIGGER set_project_inquiries_updated_at BEFORE UPDATE ON public.project_inquiries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_project_applications_updated_at') THEN
        CREATE TRIGGER set_project_applications_updated_at BEFORE UPDATE ON public.project_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE public.users IS 'User profiles with gamification features';
COMMENT ON COLUMN public.users.funding_raised IS 'Total funding raised by the user';
COMMENT ON COLUMN public.users.organizations IS 'Organizations the user is affiliated with';
COMMENT ON COLUMN public.users.achievements IS 'Achievements and awards earned by the user';
COMMENT ON COLUMN public.users.technical_skills IS 'Technical skills of the user';
COMMENT ON COLUMN public.users.soft_skills IS 'Soft skills of the user';

COMMENT ON TABLE public.projects IS 'Projects with gamification features';
COMMENT ON COLUMN public.projects.funding_received IS 'Funding received for this project';
COMMENT ON COLUMN public.projects.incubator_accelerator IS 'Incubator or accelerator programs this project has been part of';
COMMENT ON COLUMN public.projects.organizations IS 'Organizations associated with this project';
COMMENT ON COLUMN public.projects.technical_requirements IS 'Technical requirements for this project';
COMMENT ON COLUMN public.projects.soft_requirements IS 'Soft skill requirements for this project';

COMMENT ON TABLE public.events IS 'Events with status and participant management';
COMMENT ON COLUMN public.events.status IS 'Event status: pending, approved, cancelled, completed';
COMMENT ON COLUMN public.events.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN public.events.current_participants IS 'Current number of participants';

COMMENT ON TABLE public.rsvps IS 'Event RSVPs for users';
COMMENT ON TABLE public.project_application_details IS 'Detailed project application information';
COMMENT ON TABLE public.project_inquiries IS 'Project inquiries from users';
COMMENT ON TABLE public.project_applications IS 'Project applications from users'; 