-- Add missing columns to events table
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'::text,
ADD COLUMN IF NOT EXISTS max_participants integer,
ADD COLUMN IF NOT EXISTS current_participants integer DEFAULT 0;

-- Add comments for events columns
COMMENT ON COLUMN public.events.status IS 'Event status: pending, approved, cancelled, completed';
COMMENT ON COLUMN public.events.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN public.events.current_participants IS 'Current number of participants';

-- Create rsvps table
CREATE TABLE IF NOT EXISTS public.rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add primary key and constraints for rsvps
ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.rsvps
    ADD CONSTRAINT rsvps_user_event_unique UNIQUE (user_id, event_id);

-- Create indexes for rsvps
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON public.rsvps USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON public.rsvps USING btree (status);

-- Create project_application_details table
CREATE TABLE IF NOT EXISTS public.project_application_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    applicant_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add primary key and constraints for project_application_details
ALTER TABLE ONLY public.project_application_details
    ADD CONSTRAINT project_application_details_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.project_application_details
    ADD CONSTRAINT project_application_details_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.project_application_details
    ADD CONSTRAINT project_application_details_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for project_application_details
CREATE INDEX IF NOT EXISTS idx_project_application_details_project_id ON public.project_application_details USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_application_details_applicant_id ON public.project_application_details USING btree (applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_application_details_status ON public.project_application_details USING btree (status);

-- Create project_inquiries table
CREATE TABLE IF NOT EXISTS public.project_inquiries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    inquirer_id uuid NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Add primary key and constraints for project_inquiries
ALTER TABLE ONLY public.project_inquiries
    ADD CONSTRAINT project_inquiries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.project_inquiries
    ADD CONSTRAINT project_inquiries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.project_inquiries
    ADD CONSTRAINT project_inquiries_inquirer_id_fkey FOREIGN KEY (inquirer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for project_inquiries
CREATE INDEX IF NOT EXISTS idx_project_inquiries_project_id ON public.project_inquiries USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_inquirer_id ON public.project_inquiries USING btree (inquirer_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_status ON public.project_inquiries USING btree (status);

-- Create project_applications table
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

-- Add primary key and constraints for project_applications
ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT project_applications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT project_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.project_applications
    ADD CONSTRAINT project_applications_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create indexes for project_applications
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant_id ON public.project_applications USING btree (applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications USING btree (status);

-- Add comments
COMMENT ON TABLE public.rsvps IS 'Event RSVPs for users';
COMMENT ON TABLE public.project_application_details IS 'Detailed project application information';
COMMENT ON TABLE public.project_inquiries IS 'Project inquiries from users';
COMMENT ON TABLE public.project_applications IS 'Project applications from users'; 