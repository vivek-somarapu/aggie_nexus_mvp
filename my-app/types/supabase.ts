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