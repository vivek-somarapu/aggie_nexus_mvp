import { CalendarEvent } from "@/components/ui/full-calendar";

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
};

export interface ProjectSearchParams {
  search?: string;
  skill?: string;
  tamu?: boolean;
  is_idea?: boolean;
}

export interface ProjectMember {
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
  role: string;
}

export interface ProjectWithMembers extends Project {
  owner: {
    id: string;
    full_name: string;
    avatar: string | null;
  };
  members: ProjectMember[];
}

export const projectService = {
  // Get all projects
  getProjects: async (
    params?: ProjectSearchParams
  ): Promise<ProjectWithMembers[]> => {
    let url = "/api/projects";

    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append("search", params.search);
      if (params.skill) searchParams.append("skill", params.skill);
      if (params.tamu !== undefined)
        searchParams.append("tamu", params.tamu.toString());
      if (params.is_idea !== undefined)
        searchParams.append("is_idea", params.is_idea.toString());

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
      throw new Error(
        `Failed to fetch user's projects: ${response.statusText}`
      );
    }

    return response.json();
  },

  // Get a single project by ID
  getProject: async (id: string): Promise<ProjectWithMembers | null> => {
    const response = await fetch(`/api/projects/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }

    return (await response.json()) as ProjectWithMembers;
  },

  // Get featured projects
  getFeaturedProjects: async (): Promise<Project[]> => {
    const response = await fetch("/api/projects/featured");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch featured projects: ${response.statusText}`
      );
    }

    return response.json();
  },

  // Advanced search for projects
  searchProjects: async (query: string, skill?: string): Promise<Project[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append("q", query);
    if (skill) searchParams.append("skill", skill);

    const response = await fetch(
      `/api/search/projects?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to search projects: ${response.statusText}`);
    }

    return response.json();
  },

  // Create a new project
  createProject: async (
    projectData: Omit<
      Project,
      "id" | "views" | "created_at" | "last_updated" | "deleted" | "owner_id"
    > & { owner_id?: string }
  ): Promise<Project> => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

  // Update an existing project
  updateProject: async (
    id: string,
    projectData: Partial<Project>
  ): Promise<Project | null> => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
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
      method: "DELETE",
    });

    return response.ok;
  },

  // Convert project to calendar event
  projectToCalendarEvent: (project: Project): CalendarEvent => {
    // Create an end date 2 hours after the start date
    const startDate = new Date(project.estimated_start);
    const endDate = project.estimated_end
      ? new Date(project.estimated_end)
      : new Date(startDate);

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

  // Get project members
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const response = await fetch(`/api/projects/${projectId}/members`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch project members: ${response.statusText}`
      );
    }

    return response.json();
  },

  // Add members to project
  addProjectMembers: async (
    projectId: string,
    members: { user_id: string; role: string }[]
  ): Promise<ProjectMember[]> => {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ members }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add project members: ${response.statusText}`);
    }

    return response.json();
  },

  // Remove member from project
  removeProjectMember: async (projectId: string, userId: string) => {
    const res = await fetch(
      `/api/projects/${projectId}/members?user_id=${userId}`,
      { method: "DELETE" }
    );
    return res.ok;
  },

  // 📸 new gallery methods
  getProjectImages: async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/images`);
    if (!res.ok) throw new Error("Couldn’t load images");
    return (await res.json()) as {
      id: string;
      url: string;
      position: number;
    }[];
  },

  addProjectImage: async (projectId: string, url: string, position: number) => {
    const res = await fetch(`/api/projects/${projectId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, position }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('AddProjectImage error:', { status: res.status, error: err });
      throw new Error(err.error || "Failed to add image");
    }
    return (await res.json()) as { id: string; url: string; position: number };
  },

  deleteProjectImage: async (projectId: string, imageId: string) => {
    const res = await fetch(`/api/projects/${projectId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    if (!res.ok) throw new Error("Failed to delete image");
  },
};
