import { CalendarEvent } from "@/components/ui/full-calendar";
import { mockProjects } from "@/lib/utils";

export type Project = {
  id: string;
  title: string;
  description: string;
  industry: string[];
  project_status: string;
  location_type: string;
  estimated_start: Date;
  recruitment_status: string;
  is_idea: boolean;
  owner_id: string;
  views: number;
  created_at: Date;
  updated_at: Date;
};


export const projectService = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProjects;
  },

  // Get a single project by ID
  getProject: async (id: string): Promise<Project | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const project = mockProjects.find(p => p.id === id);
    return project || null;
  },

  // Create a new project
  createProject: async (projectData: Omit<Project, "id" | "views" | "created_at" | "updated_at">): Promise<Project> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate a new project with default values
    const newProject: Project = {
      id: Math.random().toString(36).substring(2, 9),
      views: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...projectData
    };
    
    // In a real implementation, this would call the API
    // mockProjects.push(newProject);
    
    return newProject;
  },

  // Update an existing project
  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project | null> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) return null;
    
    // In a real implementation, this would call the API
    // const updatedProject = {
    //   ...mockProjects[projectIndex],
    //   ...projectData,
    //   updated_at: new Date()
    // };
    // mockProjects[projectIndex] = updatedProject;
    
    return mockProjects[projectIndex];
  },

  // Delete a project
  deleteProject: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) return false;
    
    // In a real implementation, this would call the API
    // mockProjects.splice(projectIndex, 1);
    
    return true;
  },

  // Convert project to calendar event
  projectToCalendarEvent: (project: Project): CalendarEvent => {
    // Create an end date 2 hours after the start date
    const startDate = new Date(project.estimated_start);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 2);

    return {
      id: project.id,
      title: project.title,
      start: startDate,
      end: endDate,
      color: project.is_idea ? "yellow" : "green",
    };
  }
}; 