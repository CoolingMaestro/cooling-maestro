export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          subscription_plan: string | null
          subscription_status: string | null
          max_projects: number | null
          max_users: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          max_projects?: number | null
          max_users?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          max_projects?: number | null
          max_users?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string
          role: string | null
          phone: string | null
          is_active: boolean | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          full_name: string
          role?: string | null
          phone?: string | null
          is_active?: boolean | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string
          role?: string | null
          phone?: string | null
          is_active?: boolean | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_confirmations: {
        Row: {
          token: string
          user_id: string | null
          sent_at: string
          consumed_at: string | null
        }
        Insert: {
          token?: string
          user_id?: string | null
          sent_at?: string
          consumed_at?: string | null
        }
        Update: {
          token?: string
          user_id?: string | null
          sent_at?: string
          consumed_at?: string | null
        }
      }
    }
  }
}