-- Add organization verification fields to users table
-- This allows tracking which organizations a user has claimed and their verification status

-- Add organization verification tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_claims JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS organization_verifications JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.users.organization_claims IS 'Array of organizations the user has claimed membership in';
COMMENT ON COLUMN public.users.organization_verifications IS 'Object mapping organization names to verification status and metadata';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_organization_claims ON public.users USING GIN (organization_claims);
CREATE INDEX IF NOT EXISTS idx_users_organization_verifications ON public.users USING GIN (organization_verifications);

-- Example structure for organization_claims:
-- [
--   {
--     "organization": "Aggies Create",
--     "claimed_at": "2024-01-15T10:30:00Z",
--     "verification_method": "email_domain",
--     "status": "pending" | "verified" | "rejected"
--   }
-- ]

-- Example structure for organization_verifications:
-- {
--   "Aggies Create": {
--     "verified_at": "2024-01-15T11:00:00Z",
--     "verified_by": "admin@aggiescreate.org",
--     "verification_method": "admin_approval",
--     "notes": "Verified through official records"
--   }
-- } 