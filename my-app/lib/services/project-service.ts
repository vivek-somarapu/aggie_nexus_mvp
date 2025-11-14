import { CalendarEvent } from "@/components/ui/full-calendar";
import { createClient } from '@/lib/supabase/client';

export type Project = {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  is_idea: boolean;
  recruitment_status: string;
  industry: string[];
  required_skills: string[];
  location_type: string;
  estimated_start: string;
  estimated_end: string;
  contact_info: { email: string; phone?: string };
  views: number;
  created_at: string;
  last_updated: string;
  project_status: string;
  deleted: boolean;
  // Gamification fields
  organizations: string[];
  funding_received?: number;
  technical_requirements?: string[];
  soft_requirements?: string[];
  logo_url?: string | null;
  images?: string[];
};

export interface ProjectOrganizationClaim {
  id: string;
  project_id: string;
  org_id: string;
  submitted_by: string;
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


export interface ProjectSearchParams {
  search?: string;
  skill?: string;
  tamu?: boolean;
  is_idea?: boolean;
}

export const projectService = {
  // Get all projects
  getProjects: async (params?: ProjectSearchParams): Promise<Project[]> => {
    let url = '/api/projects';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.skill) searchParams.append('skill', params.skill);
      if (params.tamu !== undefined) searchParams.append('tamu', params.tamu.toString());
      if (params.is_idea !== undefined) searchParams.append('is_idea', params.is_idea.toString());
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get projects by owner ID
  getProjectsByOwnerId: async (ownerId: string): Promise<Project[]> => {
    const response = await fetch(`/api/projects?owner_id=${ownerId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user's projects: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get a single project by ID
  getProject: async (id: string): Promise<Project | null> => {
    const response = await fetch(`/api/projects/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get featured projects
  getFeaturedProjects: async (): Promise<Project[]> => {
    const response = await fetch('/api/projects/featured');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch featured projects: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  // Advanced search for projects
  searchProjects: async (query: string, skill?: string): Promise<Project[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (skill) searchParams.append('skill', skill);
    
    const response = await fetch(`/api/search/projects?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to search projects: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Create a new project
  createProject: async (projectData: Omit<Project, "id" | "views" | "created_at" | "last_updated" | "deleted" | "owner_id"> & { owner_id?: string }): Promise<Project> => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      // Try to get the detailed error message from the response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || response.statusText;
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new Error(`Failed to create project: ${errorMessage}`);
    }
    
    return response.json();
  },

  //------------------------------------------------------------
  // Logo handling (bucket: project-logos)
  //------------------------------------------------------------
  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/project-logos", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Logo upload failed");
    }
    return (await res.json()).publicUrl as string;
  },

  deleteLogo: async (publicUrl: string): Promise<void> => {
    const res = await fetch("/api/upload/project-logos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Logo deletion failed");
    }
  },

  //------------------------------------------------------------
  // Image handling (bucket: project-images)
  //------------------------------------------------------------
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/project-images", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Image upload failed");
    }
    return (await res.json()).publicUrl as string;
  },

  deleteImage: async (publicUrl: string): Promise<void> => {
    const res = await fetch("/api/upload/project-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Image deletion failed");
    }
  },

  // Update an existing project
  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project | null> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to update project: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Delete a project
  deleteProject: async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  },

  // Convert project to calendar event
  projectToCalendarEvent: (project: Project): CalendarEvent => {
    // Create an end date 2 hours after the start date
    const startDate = new Date(project.estimated_start);
    const endDate = project.estimated_end ? new Date(project.estimated_end) : new Date(startDate);
    
    if (!project.estimated_end) {
      endDate.setHours(endDate.getHours() + 2);
    }

    return {
      id: project.id,
      title: project.title,
      start: startDate,
      end: endDate,
      color: project.is_idea ? "default" : "green",
    };
  },

  // Project Organization Affiliation Methods
  // Create a new project-organization claim
  createProjectOrganizationClaim: async (projectId: string, orgName: string, submittedBy: string): Promise<ProjectOrganizationClaim> => {
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
      
      // Create the project-organization claim
      const { data, error } = await supabase
        .from('project_organization_claims')
        .insert({
          project_id: projectId,
          org_id: orgId,
          submitted_by: submittedBy,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating project-organization claim:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating project-organization claim:', error);
      throw error;
    }
  },

  // Get all project-organization claims for a project
  getProjectOrganizationClaims: async (projectId: string): Promise<ProjectOrganizationClaim[]> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('project_organization_claims')
        .select(`
          *,
          organizations (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching project organization claims:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching project organization claims:', error);
      throw error;
    }
  },

  // Check if project already has a pending claim for an organization
  hasPendingProjectOrganizationClaim: async (projectId: string, orgId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('project_organization_claims')
        .select('id')
        .eq('project_id', projectId)
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending project-organization claim:', error);
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking pending project-organization claim:', error);
      throw error;
    }
  },

  // Create project with organization affiliations
  createProjectWithAffiliations: async (
    projectData: Omit<Project, "id" | "views" | "created_at" | "last_updated" | "deleted" | "owner_id"> & { owner_id?: string },
    selectedOrganizations: string[]
  ): Promise<Project> => {
    try {
      // First create the project
      const project = await projectService.createProject(projectData);
      
      // Handle organization affiliation claims
      if (selectedOrganizations.length > 0) {
        try {
          // Get current project claims to see what's already been claimed
          const existingClaims = await projectService.getProjectOrganizationClaims(project.id);
          const existingClaimedOrgs = existingClaims.map(claim => claim.org_id);

          // Process each selected organization
          for (const orgName of selectedOrganizations) {
            // Get organization ID by name
            const supabase = createClient();
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id')
              .eq('name', orgName)
              .single();
            
            if (orgData) {
              const orgId = orgData.id;
              // Check if project already has a pending claim for this organization
              const hasPending = await projectService.hasPendingProjectOrganizationClaim(project.id, orgId);
              
              // Only create a new claim if there's no existing pending claim
              if (!hasPending && !existingClaimedOrgs.includes(orgId)) {
                await projectService.createProjectOrganizationClaim(
                  project.id, 
                  orgName, 
                  project.owner_id
                );
              }
            }
          }
        } catch (claimError) {
          console.error("Error creating project-organization claims:", claimError);
          // Don't fail the entire project creation, just log the error
        }
      }
      
      return project;
    } catch (error) {
      console.error('Error creating project with affiliations:', error);
      throw error;
    }
  },

  // Update project with organization affiliations
  updateProjectWithAffiliations: async (
    projectId: string, 
    projectData: Partial<Project>, 
    selectedOrganizations: string[]
  ): Promise<Project | null> => {
    try {
      // First update the project
      const project = await projectService.updateProject(projectId, projectData);
      
      if (!project) {
        return null;
      }

      // Handle organization affiliation claims
      if (selectedOrganizations.length > 0) {
        try {
          // Get current project claims to see what's already been claimed
          const existingClaims = await projectService.getProjectOrganizationClaims(projectId);
          const existingClaimedOrgs = existingClaims.map(claim => claim.org_id);

          // Process each selected organization
          for (const orgName of selectedOrganizations) {
            // Get organization ID by name
            const supabase = createClient();
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id')
              .eq('name', orgName)
              .single();
            
            if (orgData) {
              const orgId = orgData.id;
              // Check if project already has a pending claim for this organization
              const hasPending = await projectService.hasPendingProjectOrganizationClaim(projectId, orgId);
              
              // Only create a new claim if there's no existing pending claim
              if (!hasPending && !existingClaimedOrgs.includes(orgId)) {
                await projectService.createProjectOrganizationClaim(
                  projectId, 
                  orgName, 
                  project.owner_id
                );
              }
            }
          }
        } catch (claimError) {
          console.error("Error creating project-organization claims:", claimError);
          // Don't fail the entire project update, just log the error
        }
      }
      
      return project;
    } catch (error) {
      console.error('Error updating project with affiliations:', error);
      throw error;
    }
  }
}; 