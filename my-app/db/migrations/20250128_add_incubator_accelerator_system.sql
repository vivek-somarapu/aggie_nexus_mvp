-- Migration: Add Incubator/Accelerator System
-- Date: 2025-08-24
-- Description: Adds complete incubator/accelerator tag system with verification

-- Add organization verification fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS organization_claims JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS organization_verifications JSONB DEFAULT '{}'::jsonb;

-- Add gamification fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS funding_received DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS incubator_accelerator TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS organizations TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS technical_requirements TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS soft_requirements TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN public.users.organization_claims IS 'Array of organizations the user has claimed membership in with verification status';
COMMENT ON COLUMN public.users.organization_verifications IS 'Object mapping organization names to verification metadata';
COMMENT ON COLUMN public.projects.funding_received IS 'Total funding received for this project in USD';
COMMENT ON COLUMN public.projects.incubator_accelerator IS 'Array of incubator/accelerator programs this project is part of';
COMMENT ON COLUMN public.projects.organizations IS 'Array of organizations associated with this project';
COMMENT ON COLUMN public.projects.technical_requirements IS 'Array of technical skills required for this project';
COMMENT ON COLUMN public.projects.soft_requirements IS 'Array of soft skills required for this project';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_organization_claims ON public.users USING GIN (organization_claims);
CREATE INDEX IF NOT EXISTS idx_users_organization_verifications ON public.users USING GIN (organization_verifications);
CREATE INDEX IF NOT EXISTS idx_projects_incubator_accelerator ON public.projects USING GIN (incubator_accelerator);
CREATE INDEX IF NOT EXISTS idx_projects_funding_received ON public.projects (funding_received);

-- Verify the migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_claims') THEN
        RAISE EXCEPTION 'Failed to add organization_claims column to users table';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'incubator_accelerator') THEN
        RAISE EXCEPTION 'Failed to add incubator_accelerator column to projects table';
    END IF;
    RAISE NOTICE 'Migration completed successfully!';
END $$; 