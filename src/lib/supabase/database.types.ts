export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Generated from the linked project, then limited to crowne_ tables and functions.
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      crowne_application_status_history: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          id: string
          new_stage: string
          previous_stage: string | null
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          id?: string
          new_stage: string
          previous_stage?: string | null
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          id?: string
          new_stage?: string
          previous_stage?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crowne_application_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "crowne_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "crowne_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_applications: {
        Row: {
          applied_on: string
          candidate_id: string
          created_at: string
          id: string
          job_order_id: string
          publication_id: string | null
          recruiter: string | null
          reference: string
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          applied_on?: string
          candidate_id: string
          created_at?: string
          id?: string
          job_order_id: string
          publication_id?: string | null
          recruiter?: string | null
          reference: string
          source?: string | null
          stage: string
          updated_at?: string
        }
        Update: {
          applied_on?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_order_id?: string
          publication_id?: string | null
          recruiter?: string | null
          reference?: string
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_applications_job_order_id_fkey"
            columns: ["job_order_id"]
            isOneToOne: false
            referencedRelation: "crowne_job_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_applications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "crowne_job_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_candidate_education: {
        Row: {
          candidate_id: string
          created_at: string
          end_month: string | null
          field_of_study: string | null
          id: string
          is_current: boolean
          qualification: string
          school: string
          start_month: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          end_month?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean
          qualification: string
          school: string
          start_month: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          end_month?: string | null
          field_of_study?: string | null
          id?: string
          is_current?: boolean
          qualification?: string
          school?: string
          start_month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_candidate_education_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_candidate_documents: {
        Row: {
          candidate_id: string
          id: string
          mime_type: string | null
          name: string
          original_filename: string | null
          request_id: string | null
          sensitivity: string
          size_bytes: number | null
          status: string
          storage_path: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          candidate_id: string
          id?: string
          mime_type?: string | null
          name: string
          original_filename?: string | null
          request_id?: string | null
          sensitivity?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          candidate_id?: string
          id?: string
          mime_type?: string | null
          name?: string
          original_filename?: string | null
          request_id?: string | null
          sensitivity?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crowne_candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_candidate_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "crowne_document_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_candidate_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "crowne_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_candidate_work_experience: {
        Row: {
          candidate_id: string
          country: string | null
          created_at: string
          description: string | null
          employer_name: string
          end_month: string | null
          id: string
          is_current: boolean
          job_title: string
          start_month: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          country?: string | null
          created_at?: string
          description?: string | null
          employer_name: string
          end_month?: string | null
          id?: string
          is_current?: boolean
          job_title: string
          start_month: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          country?: string | null
          created_at?: string
          description?: string | null
          employer_name?: string
          end_month?: string | null
          id?: string
          is_current?: boolean
          job_title?: string
          start_month?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_candidate_work_experience_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_candidates: {
        Row: {
          created_at: string
          date_of_birth: string | null
          education: string | null
          email: string | null
          experience: string | null
          full_name: string
          id: string
          languages: string | null
          mobile: string | null
          nationality: string | null
          preferred_destination: string | null
          preferred_role: string | null
          profile_id: string | null
          reference: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name: string
          id?: string
          languages?: string | null
          mobile?: string | null
          nationality?: string | null
          preferred_destination?: string | null
          preferred_role?: string | null
          profile_id?: string | null
          reference: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email?: string | null
          experience?: string | null
          full_name?: string
          id?: string
          languages?: string | null
          mobile?: string | null
          nationality?: string | null
          preferred_destination?: string | null
          preferred_role?: string | null
          profile_id?: string | null
          reference?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_candidates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "crowne_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_deployment_records: {
        Row: {
          application_id: string
          created_at: string
          departure_date: string | null
          id: string
          readiness: string | null
          reference: string
          travel_status: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          departure_date?: string | null
          id?: string
          readiness?: string | null
          reference: string
          travel_status?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          departure_date?: string | null
          id?: string
          readiness?: string | null
          reference?: string
          travel_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_deployment_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "crowne_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_document_events: {
        Row: {
          action: string
          actor_id: string
          candidate_id: string
          created_at: string
          document_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string
          candidate_id: string
          created_at?: string
          document_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          candidate_id?: string
          created_at?: string
          document_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_document_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "crowne_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_document_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_document_requests: {
        Row: {
          candidate_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          requested_by: string | null
          sensitivity: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          requested_by?: string | null
          sensitivity?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          requested_by?: string | null
          sensitivity?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_document_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "crowne_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crowne_document_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "crowne_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_employers: {
        Row: {
          contact_name: string | null
          country: string
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          country: string
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      crowne_financial_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          id: string
          kind: string
          recorded_on: string
          reference: string
          related_record: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description: string
          id?: string
          kind: string
          recorded_on: string
          reference: string
          related_record?: string | null
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          kind?: string
          recorded_on?: string
          reference?: string
          related_record?: string | null
          status?: string
        }
        Relationships: []
      }
      crowne_job_orders: {
        Row: {
          channels: string[]
          country: string
          created_at: string
          employer_id: string
          id: string
          reference: string
          status: string
          title: string
          updated_at: string
          vacancies: number
        }
        Insert: {
          channels?: string[]
          country: string
          created_at?: string
          employer_id: string
          id?: string
          reference: string
          status?: string
          title: string
          updated_at?: string
          vacancies: number
        }
        Update: {
          channels?: string[]
          country?: string
          created_at?: string
          employer_id?: string
          id?: string
          reference?: string
          status?: string
          title?: string
          updated_at?: string
          vacancies?: number
        }
        Relationships: [
          {
            foreignKeyName: "crowne_job_orders_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "crowne_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_job_publications: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          id: string
          job_order_id: string
          published: boolean
          qualifications: Json
          responsibilities: Json
          salary_label: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          job_order_id: string
          published?: boolean
          qualifications?: Json
          responsibilities?: Json
          salary_label?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          id?: string
          job_order_id?: string
          published?: boolean
          qualifications?: Json
          responsibilities?: Json
          salary_label?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_job_publications_job_order_id_fkey"
            columns: ["job_order_id"]
            isOneToOne: false
            referencedRelation: "crowne_job_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_processing_checklist_items: {
        Row: {
          created_at: string
          id: string
          label: string
          processing_record_id: string
          sensitivity: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          processing_record_id: string
          sensitivity?: string
          state: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          processing_record_id?: string
          sensitivity?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_processing_checklist_items_processing_record_id_fkey"
            columns: ["processing_record_id"]
            isOneToOne: false
            referencedRelation: "crowne_processing_records"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_processing_records: {
        Row: {
          application_id: string
          created_at: string
          id: string
          next_action: string | null
          reference: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          next_action?: string | null
          reference: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          next_action?: string | null
          reference?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowne_processing_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "crowne_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      crowne_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          staff_role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          staff_role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          staff_role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crowne_can_read_finance: { Args: never; Returns: boolean }
      crowne_can_read_medical: { Args: never; Returns: boolean }
      crowne_is_staff: { Args: never; Returns: boolean }
      crowne_list_public_jobs: {
        Args: { job_id?: string }
        Returns: {
          category: string
          country: string
          description: string
          employer: string
          employment_type: string
          id: string
          job_order_reference: string
          qualifications: Json
          responsibilities: Json
          salary_label: string
          title: string
          vacancies: number
        }[]
      }
      crowne_owns_candidate: { Args: { target: string }; Returns: boolean }
      crowne_owns_candidate_folder: {
        Args: { folder: string }
        Returns: boolean
      }
      crowne_published_job_order_id: {
        Args: { publication_id: string }
        Returns: string
      }
      crowne_visible_applications: {
        Args: never
        Returns: {
          applied_on: string
          candidate_id: string
          candidate_name: string
          country: string
          employer: string
          id: string
          job_title: string
          recruiter: string
          reference: string
          source: string
          stage: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof DatabaseWithoutInternals, "public">]

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
