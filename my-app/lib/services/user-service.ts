import { User } from "@/lib/models/users";
import { createClient } from '@/lib/supabase/client';

export interface UserSearchParams {
  search?: string;
  skill?: string;
  tamu?: boolean;
}

export interface OrganizationAffiliationClaim {
  id: string;
  org_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  decided_by?: string | null;
  decided_at?: string | null;
  decision_note?: string | null;
  organizations?: {
    id: string;
    name: string;
  };
}

// Helper function for retrying fetch operations
const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (err) {
    if (retries <= 1) throw err;
    console.log(`Retrying fetch to ${url}, ${retries-1} attempts left`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait 300ms before retry
    return fetchWithRetry(url, options, retries - 1);
  }
};

export const userService = {
  // Get all users
  getUsers: async (params?: UserSearchParams): Promise<User[]> => {
    let url = '/api/users';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.skill) searchParams.append('skill', params.skill);
      if (params.tamu !== undefined) searchParams.append('tamu', params.tamu.toString());
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    console.log(`Fetching users from ${url}`);
    
    try {
      const response = await fetchWithRetry(url);
      
      if (!response.ok) {
        console.error(`Error fetching users: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Fix: Extract users array from response object
      const users = data.users || data; // Handle both { users: [...] } and [...] formats
      console.log(`Fetched ${users.length} users successfully`);
      return users;
    } catch (error) {
      console.error('Network error fetching users:', error);
      throw error;
    }
  },

  // Get a single user by ID
  getUser: async (id: string): Promise<User | null> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Advanced search for users
  searchUsers: async (query: string, skill?: string): Promise<User[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (skill) searchParams.append('skill', skill);
    
    try {
      const response = await fetchWithRetry(`/api/search/users?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search users: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (id: string, userData: Partial<User>): Promise<User | null> => {
    try {
      const supabase = createClient();
      
      // First, get the current user data to validate fields
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Update fields including profile_setup_skipped and profile_setup_completed
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const response = await fetchWithRetry(`/api/users/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  },

  // Organization Affiliation Claims Methods
  // Create a new affiliation claim
  createAffiliationClaim: async (orgName: string, userId: string): Promise<OrganizationAffiliationClaim> => {
    try {
      const supabase = createClient();

      // First get the organization ID by name
      const { data: orgData, error: orgError} = await supabase
        .from('organizations')
        .select('id')
        .eq('name', orgName)
        .single();

      if (orgError) {
        console.error('Error fetching organization ID:', orgError);
        throw orgError;
      }

      const orgId = orgData.id;
      
      // Create the affiliation claim
      const { data, error } = await supabase
        .from('organization_affiliation_claims')
        .insert({
          org_id: orgId,
          user_id: userId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating affiliation claim:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating affiliation claim:', error);
      throw error;
    }
  },

  // Get all claims for a user
  getUserAffiliationClaims: async (userId: string): Promise<OrganizationAffiliationClaim[]> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('organization_affiliation_claims')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user claims:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user claims:', error);
      throw error;
    }
  },

  // Get user's organization affiliations summary
  getUserOrganizationSummary: async (userId: string) => {
    try {
      const claims = await userService.getUserAffiliationClaims(userId);
      
      const summary = {
        totalClaims: claims.length,
        pendingClaims: claims.filter(claim => claim.status === 'pending'),
        approvedClaims: claims.filter(claim => claim.status === 'approved'),
        rejectedClaims: claims.filter(claim => claim.status === 'rejected'),
        organizations: claims.map(claim => ({
          id: claim.org_id,
          name: claim.organizations?.name || 'Unknown Organization',
          status: claim.status,
          claimedAt: claim.created_at,
          decidedAt: claim.decided_at,
          decisionNote: claim.decision_note
        }))
      };
      
      return summary;
    } catch (error) {
      console.error('Error getting user organization summary:', error);
      throw error;
    }
  },

  // Check if user already has a pending claim for an organization
  hasPendingAffiliationClaim: async (userId: string, orgId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('organization_affiliation_claims')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending claim:', error);
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking pending claim:', error);
      throw error;
    }
  },

  // Get organization ID by name
  getOrganizationIdByName: async (orgName: string): Promise<string | null> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', orgName)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching organization ID:', error);
        throw error;
      }
      
      return data?.id || null;
    } catch (error) {
      console.error('Error fetching organization ID:', error);
      throw error;
    }
  },

  // Delete a claim (for users to withdraw their claim)
  deleteAffiliationClaim: async (claimId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('organization_affiliation_claims')
        .delete()
        .eq('id', claimId);
      
      if (error) {
        console.error('Error deleting claim:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting claim:', error);
      throw error;
    }
  },

  // Update user with organization affiliations and create claims
  updateUserWithAffiliations: async (id: string, userData: Partial<User>, selectedOrganizations: string[]): Promise<User | null> => {
    try {
      const supabase = createClient();
      
      // First, update the user profile
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      // Handle organization affiliation claims
      if (selectedOrganizations.length > 0) {
        try {
          // Get current user claims to see what's already been claimed
          const existingClaims = await userService.getUserAffiliationClaims(id);
          const existingClaimedOrgs = existingClaims.map(claim => claim.org_id);

          // Process each selected organization
          for (const orgName of selectedOrganizations) {
            // Get organization ID by name
            const orgId = await userService.getOrganizationIdByName(orgName);
            
            if (orgId) {
              // Check if user already has a pending claim for this organization
              const hasPending = await userService.hasPendingAffiliationClaim(id, orgId);
              
              // Only create a new claim if there's no existing pending claim
              if (!hasPending && !existingClaimedOrgs.includes(orgId)) {
                await userService.createAffiliationClaim(orgName, id);
              }
            }
          }
        } catch (claimError) {
          console.error("Error creating organization affiliation claims:", claimError);
          // Don't fail the entire profile update, just log the error
        }
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user with affiliations:', error);
      throw error;
    }
  },
}; 