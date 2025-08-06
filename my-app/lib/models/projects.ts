import { createClient } from "@/lib/supabase/server";

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
  estimated_start: string | null;
  estimated_end: string | null;
  contact_info: { email: string; phone?: string };
  views: number;
  created_at: string;
  last_updated: string;
  project_status: string;
  deleted: boolean;
};

export type ProjectWithMembers = Project & {
  members: {
    user_id: string;
    role: string;
    user: {
      id: string;
      full_name: string;
      avatar: string | null;
    };
  }[];
};

export async function getProjectWithMembersById(
  id: string
): Promise<ProjectWithMembers | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      members:project_members (
        user_id,
        role,
        user:users (
          id,
          full_name,
          avatar
        )
      )
    `
    )
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  // members comes back as `members: [{ user_id, user: {…} }, …]`
  return data as ProjectWithMembers;
}

// Helper function to get Supabase client
const getSupabase = async () => {
  return await createClient();
};

// CREATE
export async function createProject(
  projectData: Omit<
    Project,
    "id" | "views" | "created_at" | "last_updated" | "deleted"
  >
): Promise<Project> {
  const {
    title,
    description,
    owner_id,
    is_idea,
    recruitment_status,
    industry,
    required_skills,
    location_type,
    estimated_start,
    estimated_end,
    contact_info,
    project_status,
  } = projectData;

  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      owner_id,
      is_idea,
      recruitment_status,
      industry,
      required_skills,
      location_type,
      estimated_start,
      estimated_end,
      contact_info,
      project_status,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// READ
export async function getAllProjects(): Promise<Project[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
  }));
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Record not found
    throw error;
  }

  return {
    ...data,
    contact_info: data.contact_info || {},
  };
}

export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
  }));
}

export async function searchProjects(
  searchTerm: string,
  limit = 10
): Promise<Project[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .eq("deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
  }));
}

export async function filterProjectsBySkill(skill: string): Promise<Project[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .contains("required_skills", [skill])
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
  }));
}

// UPDATE
export async function updateProject(
  id: string,
  projectData: Partial<Project>
): Promise<Project | null> {
  const supabase = await getSupabase();

  // Filter out fields we don't want to update directly
  const {
    id: _,
    views,
    created_at,
    last_updated,
    ...updateData
  } = projectData as any;

  // Sanitize date fields
  if (
    typeof updateData.estimated_start === "undefined" ||
    updateData.estimated_start === ""
  ) {
    updateData.estimated_start = null;
  }
  if (
    typeof updateData.estimated_end === "undefined" ||
    updateData.estimated_end === ""
  ) {
    updateData.estimated_end = null;
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      ...updateData,
      last_updated: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("deleted", false)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Record not found
    throw error;
  }

  return {
    ...data,
    contact_info: data.contact_info || {},
  };
}

export async function incrementProjectViews(id: string): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase.rpc("increment_project_views", {
    p_project_id: id,
  });

  if (error) throw error;
}

// DELETE (soft delete)
export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await getSupabase();

  // First delete bookmarks
  const { error: bookmarkError } = await supabase
    .from("project_bookmarks")
    .delete()
    .eq("project_id", id);

  if (bookmarkError) throw bookmarkError;

  // Then soft delete the project
  const { data, error } = await supabase
    .from("projects")
    .update({
      deleted: true,
      last_updated: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");

  if (error) throw error;

  return data && data.length > 0;
}

// Hard delete for admin purposes
export async function hardDeleteProject(id: string): Promise<boolean> {
  const supabase = await getSupabase();

  // First delete bookmarks
  const { error: bookmarkError } = await supabase
    .from("project_bookmarks")
    .delete()
    .eq("project_id", id);

  if (bookmarkError) throw bookmarkError;

  // Then hard delete the project
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw error;

  return data && data.length > 0;
}

// Add more functions for filtering, searching, etc.

// RELATIONSHIP QUERIES - Leverage Supabase's join capabilities

export type ProjectWithOwner = Project & {
  owner: {
    id: string;
    full_name: string;
    email: string;
    avatar: string | null;
  };
};

export type ProjectWithDetails = Project & {
  owner: {
    id: string;
    full_name: string;
    email: string;
    avatar: string | null;
  };
  bookmark_count?: number;
};

export async function getProjectsWithOwners(): Promise<ProjectWithOwner[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      owner:users!projects_owner_id_fkey (
        id,
        full_name,
        email,
        avatar
      )
    `
    )
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
  }));
}

export async function getProjectWithOwnerById(
  id: string
): Promise<ProjectWithOwner | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      owner:users!projects_owner_id_fkey (
        id,
        full_name,
        email,
        avatar
      )
    `
    )
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Record not found
    throw error;
  }

  return {
    ...data,
    contact_info: data.contact_info || {},
  };
}

export async function getProjectsWithBookmarkCounts(): Promise<
  ProjectWithDetails[]
> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      owner:users!projects_owner_id_fkey (
        id,
        full_name,
        email,
        avatar
      ),
      project_bookmarks (
        id
      )
    `
    )
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    contact_info: row.contact_info || {},
    bookmark_count: row.project_bookmarks?.length || 0,
  }));
}
