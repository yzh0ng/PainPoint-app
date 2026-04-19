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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      med_doses: {
        Row: {
          created_at: string
          effect: number | null
          id: string
          medication_id: string
          note: string | null
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effect?: number | null
          id?: string
          medication_id: string
          note?: string | null
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effect?: number | null
          id?: string
          medication_id?: string
          note?: string | null
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_doses_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dose: string | null
          id: string
          name: string
          notes: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dose?: string | null
          id?: string
          name: string
          notes?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dose?: string | null
          id?: string
          name?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pain_logs: {
        Row: {
          created_at: string
          id: string
          intensity: number
          logged_at: string
          note: string | null
          pain_type: Database["public"]["Enums"]["pain_type"]
          region: string
          side: string | null
          trigger: Database["public"]["Enums"]["pain_trigger"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intensity: number
          logged_at?: string
          note?: string | null
          pain_type: Database["public"]["Enums"]["pain_type"]
          region: string
          side?: string | null
          trigger?: Database["public"]["Enums"]["pain_trigger"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intensity?: number
          logged_at?: string
          note?: string | null
          pain_type?: Database["public"]["Enums"]["pain_type"]
          region?: string
          side?: string | null
          trigger?: Database["public"]["Enums"]["pain_trigger"] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          condition: Database["public"]["Enums"]["pain_condition"]
          created_at: string
          display_name: string | null
          id: string
          reminder_time: string | null
          reminders_enabled: boolean
          timezone: string | null
          updated_at: string
        }
        Insert: {
          condition?: Database["public"]["Enums"]["pain_condition"]
          created_at?: string
          display_name?: string | null
          id: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["pain_condition"]
          created_at?: string
          display_name?: string | null
          id?: string
          reminder_time?: string | null
          reminders_enabled?: boolean
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pain_condition:
        | "endometriosis"
        | "fibromyalgia"
        | "lower_back"
        | "migraine"
        | "post_surgical"
        | "arthritis"
        | "other"
        | "unspecified"
      pain_trigger:
        | "stress"
        | "sleep"
        | "exercise"
        | "weather"
        | "food"
        | "menstrual"
        | "posture"
        | "work"
        | "none"
        | "other"
      pain_type:
        | "sharp"
        | "dull"
        | "burning"
        | "throbbing"
        | "aching"
        | "stabbing"
        | "cramping"
        | "tingling"
        | "pressure"
        | "other"
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
      pain_condition: [
        "endometriosis",
        "fibromyalgia",
        "lower_back",
        "migraine",
        "post_surgical",
        "arthritis",
        "other",
        "unspecified",
      ],
      pain_trigger: [
        "stress",
        "sleep",
        "exercise",
        "weather",
        "food",
        "menstrual",
        "posture",
        "work",
        "none",
        "other",
      ],
      pain_type: [
        "sharp",
        "dull",
        "burning",
        "throbbing",
        "aching",
        "stabbing",
        "cramping",
        "tingling",
        "pressure",
        "other",
      ],
    },
  },
} as const
