import { Profile } from '@/lib/auth';

export interface OrganizationClaim {
  organization: string;
  claimed_at: string;
  verification_method?: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface OrganizationVerification {
  verified_at: string;
  verified_by: string;
  verification_method: string;
  notes?: string;
}

// Organizations that require verification (only the special incubator/accelerator programs)
// TODO: Add more organizations to this list
export const VERIFICATION_REQUIRED_ORGANIZATIONS = [
  'Aggies Create',
  'AggieX'
];

// Organizations that can be auto-verified based on email domain
// TODO: Streamline process to auto-verify members of Aggies Create and AggieX Accelerator; this is a temporary solution
export const AUTO_VERIFY_ORGANIZATIONS: Record<string, string[]> = {
  'Aggies Create': ['ruzi@tamu.edu', '@aggiescreate.com'],
  'AggieX': ['ruzi@tamu.edu', '@aggiex.org']
};

/**
 * Check if an organization requires verification
 */
export const requiresVerification = (organization: string): boolean => {
  return VERIFICATION_REQUIRED_ORGANIZATIONS.includes(organization);
};

/**
 * Check if a user can be auto-verified for an organization based on email domain
 */
export const canAutoVerify = (organization: string, email: string): boolean => {
  const allowedDomains = AUTO_VERIFY_ORGANIZATIONS[organization];
  if (!allowedDomains) return false;
  
  return allowedDomains.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
};

/**
 * Get verification status for a specific organization
 */
export const getOrganizationVerificationStatus = (
  profile: Profile | null,
  organization: string
): 'pending' | 'verified' | 'rejected' | 'not_claimed' => {
  if (!profile?.organization_claims) return 'not_claimed';
  
  const claim = profile.organization_claims.find(
    claim => claim.organization === organization
  );
  
  return claim?.status || 'not_claimed';
};

/**
 * Check if user has verified membership in an organization
 */
export const hasVerifiedMembership = (
  profile: Profile | null,
  organization: string
): boolean => {
  return getOrganizationVerificationStatus(profile, organization) === 'verified';
};

/**
 * Get all verified organizations for a user
 */
export const getVerifiedOrganizations = (profile: Profile | null): string[] => {
  if (!profile?.organization_claims) return [];
  
  return profile.organization_claims
    .filter(claim => claim.status === 'verified')
    .map(claim => claim.organization);
};

/**
 * Get all pending organization claims for a user
 */
export const getPendingOrganizations = (profile: Profile | null): string[] => {
  if (!profile?.organization_claims) return [];
  
  return profile.organization_claims
    .filter(claim => claim.status === 'pending')
    .map(claim => claim.organization);
};

/**
 * Create a new organization claim
 */
export const createOrganizationClaim = (
  organization: string,
  verificationMethod?: string
): OrganizationClaim => {
  return {
    organization,
    claimed_at: new Date().toISOString(),
    verification_method: verificationMethod,
    status: 'pending'
  };
};

/**
 * Auto-verify organization based on email domain
 */
export const autoVerifyOrganization = (
  organization: string,
  email: string
): OrganizationVerification | null => {
  if (!canAutoVerify(organization, email)) return null;
  
  return {
    verified_at: new Date().toISOString(),
    verified_by: 'system',
    verification_method: 'email_domain',
    notes: `Auto-verified based on email domain: ${email}`
  };
}; 