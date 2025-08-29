export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Database interfaces for type safety
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          bio: string | null
          industry: string[]
          skills: string[]
          linkedin_url: string | null
          website_url: string | null
          resume_url: string | null
          additional_links: Json | null
          contact: Json
          views: number
          graduation_year: number | null
          is_texas_am_affiliate: boolean
          avatar: string | null
          password_hash: string | null
          created_at: string | null
          updated_at: string | null
          refresh_token: string | null
          email_verified: boolean | null
          deleted: boolean
          role: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          bio?: string | null
          industry: string[]
          skills: string[]
          linkedin_url?: string | null
          website_url?: string | null
          resume_url?: string | null
          additional_links?: Json | null
          contact: Json
          views: number
          graduation_year?: number | null
          is_texas_am_affiliate: boolean
          avatar?: string | null
          password_hash?: string | null
          created_at?: string | null
          updated_at?: string | null
          refresh_token?: string | null
          email_verified?: boolean | null
          deleted: boolean
          role?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          bio?: string | null
          industry?: string[]
          skills?: string[]
          linkedin_url?: string | null
          website_url?: string | null
          resume_url?: string | null
          additional_links?: Json | null
          contact?: Json
          views?: number
          graduation_year?: number | null
          is_texas_am_affiliate?: boolean
          avatar?: string | null
          password_hash?: string | null
          created_at?: string | null
          updated_at?: string | null
          refresh_token?: string | null
          email_verified?: boolean | null
          deleted?: boolean
          role?: string
        }
      }
      // New verification system tables
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          website_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_managers: {
        Row: {
          org_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          created_at?: string
        }
      }
      organization_members: {
        Row: {
          org_id: string
          user_id: string
          verified_by: string | null
          verified_at: string
        }
        Insert: {
          org_id: string
          user_id: string
          verified_by?: string | null
          verified_at?: string
        }
        Update: {
          org_id?: string
          user_id?: string
          verified_by?: string | null
          verified_at?: string
        }
      }
      organization_affiliation_claims: {
        Row: {
          id: string
          org_id: string
          user_id: string
          evidence: Json
          status: string
          created_at: string
          decided_by: string | null
          decided_at: string | null
          decision_note: string | null
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          evidence?: Json
          status?: string
          created_at?: string
          decided_by?: string | null
          decided_at?: string | null
          decision_note?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          evidence?: Json
          status?: string
          created_at?: string
          decided_by?: string | null
          decided_at?: string | null
          decision_note?: string | null
        }
      }
      project_organization_claims: {
        Row: {
          id: string
          project_id: string
          org_id: string
          submitted_by: string
          evidence: Json
          status: string
          created_at: string
          decided_by: string | null
          decided_at: string | null
          decision_note: string | null
        }
        Insert: {
          id?: string
          project_id: string
          org_id: string
          submitted_by: string
          evidence?: Json
          status?: string
          created_at?: string
          decided_by?: string | null
          decided_at?: string | null
          decision_note?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          org_id?: string
          submitted_by?: string
          evidence?: Json
          status?: string
          created_at?: string
          decided_by?: string | null
          decided_at?: string | null
          decision_note?: string | null
        }
      }
      project_organizations: {
        Row: {
          project_id: string
          org_id: string
          verified_by: string | null
          verified_at: string
        }
        Insert: {
          project_id: string
          org_id: string
          verified_by?: string | null
          verified_at?: string
        }
        Update: {
          project_id?: string
          org_id?: string
          verified_by?: string | null
          verified_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          color: string
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          color: string
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          color?: string
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          owner_id: string
          is_idea: boolean
          recruitment_status: string
          industry: string[]
          required_skills: string[]
          location_type: string
          estimated_start: string | null
          estimated_end: string | null
          contact_info: Json
          views: number
          created_at: string | null
          last_updated: string | null
          project_status: string
          deleted: boolean
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          owner_id: string
          is_idea: boolean
          recruitment_status: string
          industry: string[]
          required_skills: string[]
          location_type: string
          estimated_start?: string | null
          estimated_end?: string | null
          contact_info: Json
          views: number
          created_at?: string | null
          last_updated?: string | null
          project_status: string
          deleted: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          owner_id?: string
          is_idea?: boolean
          recruitment_status?: string
          industry?: string[]
          required_skills?: string[]
          location_type?: string
          estimated_start?: string | null
          estimated_end?: string | null
          contact_info?: Json
          views?: number
          created_at?: string | null
          last_updated?: string | null
          project_status?: string
          deleted?: boolean
          updated_at?: string | null
        }
      }
      user_bookmarks: {
        Row: {
          id: string
          user_id: string
          bookmarked_user_id: string
          saved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          bookmarked_user_id: string
          saved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          bookmarked_user_id?: string
          saved_at?: string | null
        }
      }
      project_bookmarks: {
        Row: {
          id: string
          user_id: string
          project_id: string
          saved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          saved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          saved_at?: string | null
        }
      }
    }
  }
} 