import { getClient } from "../db";

export type User = {
  id: string;
  full_name: string;
  email: string;
  bio: string | null;
  industry: string[];
  skills: string[];
  linkedin_url: string | null;
  website_url: string | null;
  resume_url: string | null;
  additional_links: Array<{ title: string; url: string }>;
  contact: { email: string; phone?: string };
  views: number;
  graduation_year: number | null;
  is_texas_am_affiliate: boolean;
  avatar: string | null;
  created_at: string;
  updated_at: string;
  profile_setup_skipped?: boolean;
  profile_setup_skipped_at?: string;
  profile_setup_completed?: boolean;
};

// CREATE
export async function createUser(
  userData: Omit<User, "id" | "views" | "created_at" | "updated_at">
): Promise<User> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      full_name: userData.full_name,
      email: userData.email,
      bio: userData.bio,
      industry: userData.industry,
      skills: userData.skills,
      linkedin_url: userData.linkedin_url,
      website_url: userData.website_url,
      resume_url: userData.resume_url,
      additional_links: userData.additional_links || [],
      contact: userData.contact || {},
      graduation_year: userData.graduation_year,
      is_texas_am_affiliate: userData.is_texas_am_affiliate,
      avatar: userData.avatar,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }

  return data;
}

// READ
export async function getAllUsers(): Promise<User[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("full_name");

  if (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }

  return (data || []).map((user: any) => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {},
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found error
      return null;
    }
    console.error("Error fetching user by ID:", error);
    throw new Error("Failed to fetch user");
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found error
      return null;
    }
    console.error("Error fetching user by email:", error);
    throw new Error("Failed to fetch user by email");
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
  };
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(
      `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`
    )
    .order("full_name");

  if (error) {
    console.error("Error searching users:", error);
    throw new Error("Failed to search users");
  }

  return (data || []).map((user: any) => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {},
  }));
}

export async function filterUsersBySkill(skill: string): Promise<User[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .contains("skills", [skill])
    .order("full_name");

  if (error) {
    console.error("Error filtering users by skill:", error);
    throw new Error("Failed to filter users by skill");
  }

  return (data || []).map((user: any) => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {},
  }));
}

// UPDATE
export async function updateUser(
  id: string,
  userData: Partial<User>
): Promise<User | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .update(userData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return null;
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
  };
}

export async function incrementUserViews(id: string): Promise<void> {
  const supabase = await getClient();
  const { error } = await supabase.rpc('increment_user_views', { user_id: id });

  if (error) {
    console.error("Error incrementing user views:", error);
    throw new Error("Failed to increment user views");
  }
}

export async function setUserProfileSetupSkipped(id: string): Promise<User | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      profile_setup_skipped: true,
      profile_setup_skipped_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error setting profile setup skipped:", error);
    return null;
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
  };
}

export async function setUserProfileSetupCompleted(id: string): Promise<User | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .update({
      profile_setup_completed: true,
      profile_setup_skipped: false,
      profile_setup_skipped_at: null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error setting profile setup completed:", error);
    return null;
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
  };
}

// DELETE
export async function deleteUser(id: string): Promise<boolean> {
  const supabase = await getClient();
  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    return false;
  }

  return true;
}

// Add more functions as needed for searching, filtering, etc.

// RELATIONSHIP QUERIES - Leverage Supabase's join capabilities

export type UserWithProjects = User & {
  projects: {
    id: string;
    title: string;
    description: string;
    project_status: string;
    is_idea: boolean;
    created_at: string;
  }[];
};

export type UserWithBookmarksCount = User & {
  bookmark_count: number;
  project_count: number;
};

export async function getUsersWithProjects(): Promise<UserWithProjects[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      projects!projects_owner_id_fkey (
        id,
        title,
        description,
        project_status,
        is_idea,
        created_at
      )
    `)
    .eq("deleted", false)
    .order("full_name");

  if (error) {
    console.error("Error fetching users with projects:", error);
    throw new Error("Failed to fetch users with projects");
  }

  return (data || []).map((user: any) => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {},
    projects: user.projects || []
  }));
}

export async function getUserWithProjectsById(id: string): Promise<UserWithProjects | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      projects!projects_owner_id_fkey (
        id,
        title,
        description,
        project_status,
        is_idea,
        created_at
      )
    `)
    .eq("id", id)
    .eq("deleted", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user with projects:", error);
    throw new Error("Failed to fetch user with projects");
  }

  return {
    ...data,
    additional_links: data.additional_links || [],
    contact: data.contact || {},
    projects: data.projects || []
  };
}

export async function getUsersWithCounts(): Promise<UserWithBookmarksCount[]> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      user_bookmarks_user_id_fkey!inner (
        id
      ),
      projects!projects_owner_id_fkey (
        id
      )
    `)
    .eq("deleted", false)
    .order("full_name");

  if (error) {
    console.error("Error fetching users with counts:", error);
    throw new Error("Failed to fetch users with counts");
  }

  return (data || []).map((user: any) => ({
    ...user,
    additional_links: user.additional_links || [],
    contact: user.contact || {},
    bookmark_count: user.user_bookmarks_user_id_fkey?.length || 0,
    project_count: user.projects?.length || 0
  }));
}
