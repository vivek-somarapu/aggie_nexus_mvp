import { Project } from './project-service';

export type Organization = {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
  logo_url?: string | null;
  images?: string[]; // Array of image URLs
  members?: Array<{
    id: string;
    full_name: string;
    avatar: string | null;
    email: string;
  }>;
  industry?: string[]; // Array of industry tags
  founded_date?: string | null;
  joined_aggiex_date?: string | null;
  contact?: {
    email?: string;
    phone?: string;
  };
  additional_links?: Array<{
    label: string;
    url: string;
  }>;
  imageRecords?: Array<{
    id: string;
    url: string;
    position: number;
  }>;
  is_texas_am_affiliate: boolean;
};

export interface OrganizationSearchParams {
  search?: string;
  sort?: string; // e.g., 'name', 'created_at'
  order?: 'asc' | 'desc';
}

export const organizationService = {
  // Get all organizations
  getOrganizations: async (params?: OrganizationSearchParams): Promise<Organization[]> => {
    let url = '/api/organizations';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append('search', params.search);
      if (params.sort) searchParams.append('sort', params.sort);
      if (params.order) searchParams.append('order', params.order);
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get a single organization by ID
  getOrganization: async (id: string): Promise<Organization | null> => {
    const response = await fetch(`/api/organizations/${id}`);
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch organization: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.organization || data;
  },

  getOrganizationProjects: async (id: string): Promise<Project[]> => {
    const response = await fetch(`/api/organizations/${id}/projects`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organization projects: ${response.statusText}`);
    }
    return response.json();
  },

  // Get organization members
  getOrganizationMembers: async (id: string): Promise<Array<{
    id: string;
    full_name: string;
    avatar: string | null;
    email: string;
    bio: string | null;
  }>> => {
    const response = await fetch(`/api/organizations/${id}/members`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organization members: ${response.statusText}`);
    }
    return response.json();
  },

  // Get organization managers (executive team)
  getOrganizationManagers: async (id: string): Promise<Array<{
    id: string;
    full_name: string;
    avatar: string | null;
    email: string;
    bio: string | null;
    is_texas_am_affiliate: boolean;
  }>> => {
    const response = await fetch(`/api/organizations/${id}/managers`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organization managers: ${response.statusText}`);
    }
    return response.json();
  },

  // Search organizations
  searchOrganizations: async (searchTerm: string): Promise<Organization[]> => {
    return organizationService.getOrganizations({ search: searchTerm });
  },

  // Upload organization logo
  uploadLogo: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/organization-logos", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Logo upload failed");
    }
    return (await res.json()).publicUrl as string;
  },

  // Delete organization logo
  deleteLogo: async (publicUrl: string): Promise<void> => {
    const res = await fetch("/api/upload/organization-logos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Logo deletion failed");
    }
  },

  // Upload organization image
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload/organization-images", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Image upload failed");
    }
    return (await res.json()).publicUrl as string;
  },

  // Delete organization image
  deleteImage: async (publicUrl: string): Promise<void> => {
    const res = await fetch("/api/upload/organization-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || "Image deletion failed");
    }
  },

  // Update an existing organization
  updateOrganization: async (id: string, organizationData: Partial<Organization>): Promise<Organization | null> => {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to update organization: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.organization || data;
  },
};

