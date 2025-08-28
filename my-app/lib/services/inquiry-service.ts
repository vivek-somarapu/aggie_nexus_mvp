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
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('project_application_details')
        .select('*')
        .eq('project_owner_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
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
        .from('project_application_details')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
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
      
      const { count, error } = await supabase
        .from('project_application_details')
        .select('*', { count: 'exact', head: true })
        .eq('project_owner_id', userId)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      return count || 0;
    } catch (err: any) {
      console.error("Error fetching pending inquiries count:", err);
      return 0;
    }
  }
}; 