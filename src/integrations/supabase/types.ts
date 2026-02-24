export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          org_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          org_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_modules: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          tags: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          tags?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      consent_requests: {
        Row: {
          created_at: string
          deleted_at: string | null
          expiration_date: string | null
          id: string
          is_sud: boolean | null
          org_id: string
          patient_id: string
          provider_id: string
          sent_at: string | null
          signed_at: string | null
          status: string
          sud_info_description: string | null
          sud_purpose: string | null
          sud_recipient_name: string | null
          sud_specific_purpose: string | null
          template_id: string | null
          template_version: number | null
          updated_at: string
          viewed_at: string | null
          withdrawal_reason: string | null
          withdrawn_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expiration_date?: string | null
          id?: string
          is_sud?: boolean | null
          org_id: string
          patient_id: string
          provider_id: string
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          sud_info_description?: string | null
          sud_purpose?: string | null
          sud_recipient_name?: string | null
          sud_specific_purpose?: string | null
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
          viewed_at?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expiration_date?: string | null
          id?: string
          is_sud?: boolean | null
          org_id?: string
          patient_id?: string
          provider_id?: string
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          sud_info_description?: string | null
          sud_purpose?: string | null
          sud_recipient_name?: string | null
          sud_specific_purpose?: string | null
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
          viewed_at?: string | null
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "consent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_submissions: {
        Row: {
          created_at: string
          id: string
          invite_id: string
          module_id: string | null
          patient_email: string
          patient_first_name: string
          patient_last_name: string
          pdf_url: string | null
          provider_id: string | null
          signature: string
          signed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_id: string
          module_id?: string | null
          patient_email: string
          patient_first_name: string
          patient_last_name: string
          pdf_url?: string | null
          provider_id?: string | null
          signature: string
          signed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_id?: string
          module_id?: string | null
          patient_email?: string
          patient_first_name?: string
          patient_last_name?: string
          pdf_url?: string | null
          provider_id?: string | null
          signature?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_submissions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_submissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "consent_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_templates: {
        Row: {
          consent_text: string
          created_at: string
          created_by: string
          deleted_at: string | null
          education_materials: Json | null
          id: string
          is_sud: boolean | null
          org_id: string
          status: string | null
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          consent_text: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          education_materials?: Json | null
          id?: string
          is_sud?: boolean | null
          org_id: string
          status?: string | null
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          consent_text?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          education_materials?: Json | null
          id?: string
          is_sud?: boolean | null
          org_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_withdrawals: {
        Row: {
          created_at: string
          id: string
          patient_user_id: string
          reason: string | null
          submission_id: string
          withdrawn_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_user_id: string
          reason?: string | null
          submission_id: string
          withdrawn_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_user_id?: string
          reason?: string | null
          submission_id?: string
          withdrawn_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_withdrawals_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "consent_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          custom_message: string | null
          expires_at: string
          id: string
          module_id: string
          patient_email: string
          patient_first_name: string | null
          patient_last_name: string | null
          patient_phone: string | null
          patient_user_id: string | null
          status: Database["public"]["Enums"]["invite_status"]
          token: string
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          module_id: string
          patient_email: string
          patient_first_name?: string | null
          patient_last_name?: string | null
          patient_phone?: string | null
          patient_user_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          custom_message?: string | null
          expires_at?: string
          id?: string
          module_id?: string
          patient_email?: string
          patient_first_name?: string | null
          patient_last_name?: string | null
          patient_phone?: string | null
          patient_user_id?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          token?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "consent_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          npi_number: string | null
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          npi_number?: string | null
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          npi_number?: string | null
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_notification_preferences: {
        Row: {
          created_at: string
          email_consent_reminders: boolean
          email_expiration_alerts: boolean
          email_provider_updates: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_consent_reminders?: boolean
          email_expiration_alerts?: boolean
          email_provider_updates?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_consent_reminders?: boolean
          email_expiration_alerts?: boolean
          email_provider_updates?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          created_at: string
          date_of_birth: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          preferred_contact: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          preferred_contact?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          practice_name: string | null
          primary_specialty: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          practice_name?: string | null
          primary_specialty?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          practice_name?: string | null
          primary_specialty?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          block_number: number | null
          blockchain_status: string | null
          consent_hash: string
          consent_request_id: string
          deleted_at: string | null
          encrypted_signature_data: string | null
          id: string
          ip_address: unknown
          patient_id: string
          prohibition_acknowledged: boolean | null
          signature_data: string
          signature_type: string
          signed_at: string
          tx_hash: string | null
          user_agent: string | null
        }
        Insert: {
          block_number?: number | null
          blockchain_status?: string | null
          consent_hash: string
          consent_request_id: string
          deleted_at?: string | null
          encrypted_signature_data?: string | null
          id?: string
          ip_address?: unknown
          patient_id: string
          prohibition_acknowledged?: boolean | null
          signature_data: string
          signature_type: string
          signed_at?: string
          tx_hash?: string | null
          user_agent?: string | null
        }
        Update: {
          block_number?: number | null
          blockchain_status?: string | null
          consent_hash?: string
          consent_request_id?: string
          deleted_at?: string | null
          encrypted_signature_data?: string | null
          id?: string
          ip_address?: unknown
          patient_id?: string
          prohibition_acknowledged?: boolean | null
          signature_data?: string
          signature_type?: string
          signed_at?: string
          tx_hash?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatures_consent_request_id_fkey"
            columns: ["consent_request_id"]
            isOneToOne: false
            referencedRelation: "consent_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string | null
          encrypted_ssn: string | null
          full_name: string
          id: string
          last_login_at: string | null
          mfa_enabled: boolean | null
          org_id: string
          phone: string | null
          practice_name: string | null
          primary_specialty: string | null
          role: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          encrypted_ssn?: string | null
          full_name: string
          id: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          org_id: string
          phone?: string | null
          practice_name?: string | null
          primary_specialty?: string | null
          role: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          encrypted_ssn?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          org_id?: string
          phone?: string | null
          practice_name?: string | null
          primary_specialty?: string | null
          role?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          custom_message: string
          expires_at: string
          id: string
          module_description: string
          module_id: string
          module_name: string
          module_video_url: string
          patient_email: string
          patient_first_name: string
          patient_last_name: string
          provider_full_name: string
          provider_practice_name: string
          status: Database["public"]["Enums"]["invite_status"]
          token: string
        }[]
      }
      link_invite_patient_user_by_token: {
        Args: { p_first_name: string; p_last_name: string; p_token: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_org_id?: string
          p_resource_id: string
          p_resource_type: string
        }
        Returns: string
      }
      mark_invite_viewed: { Args: { p_token: string }; Returns: boolean }
      submit_consent_by_token: {
        Args: {
          p_patient_first_name: string
          p_patient_last_name: string
          p_signature: string
          p_token: string
        }
        Returns: string
      }
      update_invite_patient_info_by_token: {
        Args: { p_first_name: string; p_last_name: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "provider" | "patient"
      invite_status: "pending" | "viewed" | "completed" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["provider", "patient"],
      invite_status: ["pending", "viewed", "completed", "expired"],
    },
  },
} as const
