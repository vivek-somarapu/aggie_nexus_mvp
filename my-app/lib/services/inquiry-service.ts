import { createClient } from "@/lib/supabase/client";

export interface ProjectInquiry {
  id: string;
  project_id: string;
  project_title: string;
  user_id: string;
  note: string;
  status: string;
  created_at: string;
  project_owner_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_avatar: string | null;
  applicant_bio: string | null;
}

export const inquiryService = {
  // Get inquiries for projects owned by a user
  getReceivedInquiries: async (userId: string): Promise<ProjectInquiry[]> => {
    try {
      console.log("getReceivedInquiries called with userId:", userId);
      const supabase = createClient();

      // First, get all projects that the user owns and their general user info
      console.log("Fetching user info...");
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email, avatar, bio')
        .eq('id', userId)
        .single();

      console.log("User info query result:", { userData, userError });
      console.log("Fetching projects owned by user...");
      const { data: ownedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', userId);

      console.log("Projects query result:", { ownedProjects, projectsError });

      if (projectsError) {
        console.error("Error fetching owned projects:", projectsError);
        throw projectsError;
      }

      if (!ownedProjects || ownedProjects.length === 0) {
        console.log("User doesn't own any projects, returning empty array");
        // User doesn't own any projects, return empty array
        return [];
      }

      // Extract the project IDs
      const projectIds = ownedProjects.map(project => project.id);
      console.log("Project IDs owned by user:", projectIds);
      
      // Then fetch all inquiries for projects that the user owns
      console.log("Fetching inquiries for owned projects...");
      const { data, error } = await supabase
        .from('project_applications')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      
      console.log("Inquiries query result:", { data, error });

      if (error) {
        console.error("Error fetching inquiries:", error);
        throw error;
      }
      
      console.log("Successfully fetched inquiries:", data?.length || 0);
      
      // Transform the data to match ProjectInquiry interface
      const transformedData = data?.map(inquiry => ({
        id: inquiry.id,
        project_id: inquiry.project_id,
        project_title: 'Project', // Will be populated later if needed
        user_id: inquiry.user_id,
        note: inquiry.note,
        status: inquiry.status,
        created_at: inquiry.created_at,
        project_owner_id: userId, // The current user is the project owner
        applicant_name: userData?.full_name || 'Unknown User', // Will be populated later if needed
        applicant_email: userData?.email || '', // Will be populated later if needed
        applicant_avatar: userData?.avatar || null,
        applicant_bio: userData?.bio || null
      })) || [];
      
      return transformedData;
    } catch (err: any) {
      console.error("Error fetching received inquiries:", err);
      throw new Error(err?.message || "Failed to load inquiries");
    }
  },

  // Get inquiries submitted by a user
  getSentInquiries: async (userId: string): Promise<ProjectInquiry[]> => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('project_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to match ProjectInquiry interface
      const transformedData = data?.map(inquiry => ({
        id: inquiry.id,
        project_id: inquiry.project_id,
        project_title: 'Project', // Will be populated later if needed
        user_id: inquiry.user_id,
        note: inquiry.note,
        status: inquiry.status,
        created_at: inquiry.created_at,
        project_owner_id: '', // Will be populated later if needed
        applicant_name: '', // Not needed for sent inquiries
        applicant_email: '', // Not needed for sent inquiries
        applicant_avatar: null,
        applicant_bio: null
      })) || [];
      
      return transformedData;
    } catch (err: any) {
      console.error("Error fetching sent inquiries:", err);
      throw new Error(err?.message || "Failed to load inquiries");
    }
  },

  // Submit a new inquiry
  submitInquiry: async (projectId: string, userId: string, note: string): Promise<void> => {
    try {
      const supabase = createClient();
      
      // Check if user already applied to this project
      const { data: existingApplications } = await supabase
        .from('project_applications')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      
      if (existingApplications) {
        throw new Error("You have already submitted an inquiry for this project");
      }
      
      // Submit new application
      const { error } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          user_id: userId,
          note: note,
          status: 'pending'
        });
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Error submitting inquiry:", err);
      throw new Error(err?.message || "Failed to submit inquiry");
    }
  },

  // Update inquiry status (accept/reject)
  updateInquiryStatus: async (inquiryId: string, status: 'accepted' | 'rejected'): Promise<void> => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('project_applications')
        .update({ status })
        .eq('id', inquiryId);
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Error updating inquiry status:", err);
      throw new Error(err?.message || "Failed to update inquiry status");
    }
  },

  // Delete an inquiry
  deleteInquiry: async (inquiryId: string): Promise<void> => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('project_applications')
        .delete()
        .eq('id', inquiryId);
      
      if (error) throw error;
    } catch (err: any) {
      console.error("Error deleting inquiry:", err);
      throw new Error(err?.message || "Failed to delete inquiry");
    }
  },

  // Get count of pending inquiries
  getPendingInquiriesCount: async (userId: string): Promise<number> => {
    try {
      const supabase = createClient();
      
      // First get projects owned by the user
      const { data: ownedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', userId);

      if (projectsError) throw projectsError;

      if (!ownedProjects || ownedProjects.length === 0) {
        return 0;
      }

      const projectIds = ownedProjects.map(project => project.id);
      
      // Then count pending inquiries for those projects
      const { count, error } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      return count || 0;
    } catch (err: any) {
      console.error("Error fetching pending inquiries count:", err);
      return 0;
    }
  }
}; 