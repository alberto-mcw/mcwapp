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
      challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          energy_earned: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          energy_earned: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          energy_earned?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          challenge_id: string
          created_at: string
          description: string | null
          dish_name: string | null
          id: string
          likes_count: number
          likes_from_metrics: number | null
          metrics_energy_earned: number | null
          metrics_screenshot_url: string | null
          recipe_data: Json | null
          reel_url: string | null
          status: string
          thumbnail_url: string | null
          transcription: string | null
          transcription_status: string | null
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          description?: string | null
          dish_name?: string | null
          id?: string
          likes_count?: number
          likes_from_metrics?: number | null
          metrics_energy_earned?: number | null
          metrics_screenshot_url?: string | null
          recipe_data?: Json | null
          reel_url?: string | null
          status?: string
          thumbnail_url?: string | null
          transcription?: string | null
          transcription_status?: string | null
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          description?: string | null
          dish_name?: string | null
          id?: string
          likes_count?: number
          likes_from_metrics?: number | null
          metrics_energy_earned?: number | null
          metrics_screenshot_url?: string | null
          recipe_data?: Json | null
          reel_url?: string | null
          status?: string
          thumbnail_url?: string | null
          transcription?: string | null
          transcription_status?: string | null
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          created_by: string | null
          description: string
          ends_at: string
          energy_reward: number
          id: string
          is_active: boolean
          starts_at: string
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          created_by?: string | null
          description: string
          ends_at: string
          energy_reward?: number
          id?: string
          is_active?: boolean
          starts_at: string
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string
          energy_reward?: number
          id?: string
          is_active?: boolean
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      daily_trivias: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          correct_answer: number
          created_at: string
          difficulty: string
          energy_reward: number
          explanation: string
          fun_fact: string
          id: string
          options: Json
          question: string
          scheduled_date: string
          status: string
          title: string
          trivia_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          correct_answer: number
          created_at?: string
          difficulty?: string
          energy_reward?: number
          explanation: string
          fun_fact: string
          id?: string
          options?: Json
          question: string
          scheduled_date: string
          status?: string
          title: string
          trivia_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          correct_answer?: number
          created_at?: string
          difficulty?: string
          energy_reward?: number
          explanation?: string
          fun_fact?: string
          id?: string
          options?: Json
          question?: string
          scheduled_date?: string
          status?: string
          title?: string
          trivia_type?: string
        }
        Relationships: []
      }
      presentation_videos: {
        Row: {
          created_at: string
          energy_awarded: boolean
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          energy_awarded?: boolean
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          energy_awarded?: boolean
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          instagram_handle: string | null
          tiktok_handle: string | null
          total_energy: number
          twitter_handle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          tiktok_handle?: string | null
          total_energy?: number
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          instagram_handle?: string | null
          tiktok_handle?: string | null
          total_energy?: number
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recetario_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          referred_by: string | null
          source: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          referred_by?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          referred_by?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recetario_leads_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "recetario_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_collection_items: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          recipe_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          recipe_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "recipe_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_collection_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_collections: {
        Row: {
          cover_photo_url: string | null
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collections_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "recetario_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_interactions: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          lead_id: string | null
          recipe_id: string
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          lead_id?: string | null
          recipe_id: string
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          recipe_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "recetario_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_shares: {
        Row: {
          clicks: number | null
          created_at: string
          id: string
          new_users_generated: number | null
          recipe_id: string
          share_token: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string
          id?: string
          new_users_generated?: number | null
          recipe_id: string
          share_token: string
        }
        Update: {
          clicks?: number | null
          created_at?: string
          id?: string
          new_users_generated?: number | null
          recipe_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_shares_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          ai_story: string | null
          alternatives: Json | null
          calories_per_serving: number | null
          corrected_text: string | null
          created_at: string
          difficulty: string | null
          estimated_time: string | null
          healthy_version: Json | null
          healthy_version_active: boolean | null
          id: string
          is_favorite: boolean | null
          lead_id: string | null
          ocr_text: string | null
          original_image_url: string | null
          pdf_url: string | null
          recipe_type: string | null
          regional_style: string | null
          servings: number | null
          share_token: string | null
          shopping_list: Json | null
          status: string
          structured_data: Json | null
          title: string
          updated_at: string
          user_id: string | null
          visibility: string
        }
        Insert: {
          ai_story?: string | null
          alternatives?: Json | null
          calories_per_serving?: number | null
          corrected_text?: string | null
          created_at?: string
          difficulty?: string | null
          estimated_time?: string | null
          healthy_version?: Json | null
          healthy_version_active?: boolean | null
          id?: string
          is_favorite?: boolean | null
          lead_id?: string | null
          ocr_text?: string | null
          original_image_url?: string | null
          pdf_url?: string | null
          recipe_type?: string | null
          regional_style?: string | null
          servings?: number | null
          share_token?: string | null
          shopping_list?: Json | null
          status?: string
          structured_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Update: {
          ai_story?: string | null
          alternatives?: Json | null
          calories_per_serving?: number | null
          corrected_text?: string | null
          created_at?: string
          difficulty?: string | null
          estimated_time?: string | null
          healthy_version?: Json | null
          healthy_version_active?: boolean | null
          id?: string
          is_favorite?: boolean | null
          lead_id?: string | null
          ocr_text?: string | null
          original_image_url?: string | null
          pdf_url?: string | null
          recipe_type?: string | null
          regional_style?: string | null
          servings?: number | null
          share_token?: string | null
          shopping_list?: Json | null
          status?: string
          structured_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "recetario_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      social_verifications: {
        Row: {
          action_type: string
          energy_earned: number
          id: string
          platform: string
          user_email: string
          verified_at: string
        }
        Insert: {
          action_type?: string
          energy_earned?: number
          id?: string
          platform?: string
          user_email: string
          verified_at?: string
        }
        Update: {
          action_type?: string
          energy_earned?: number
          id?: string
          platform?: string
          user_email?: string
          verified_at?: string
        }
        Relationships: []
      }
      super_likes: {
        Row: {
          admin_user_id: string
          created_at: string
          energy_awarded: number
          id: string
          submission_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          energy_awarded?: number
          id?: string
          submission_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          energy_awarded?: number
          id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_likes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "challenge_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_completions: {
        Row: {
          completed_at: string
          energy_earned: number
          id: string
          is_correct: boolean
          selected_answer: number
          trivia_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          energy_earned?: number
          id?: string
          is_correct: boolean
          selected_answer: number
          trivia_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          energy_earned?: number
          id?: string
          is_correct?: boolean
          selected_answer?: number
          trivia_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trivia_completions_trivia_id_fkey"
            columns: ["trivia_id"]
            isOneToOne: false
            referencedRelation: "daily_trivias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_completions_trivia_id_fkey"
            columns: ["trivia_id"]
            isOneToOne: false
            referencedRelation: "daily_trivias_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "challenge_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_trivias_public: {
        Row: {
          created_at: string | null
          difficulty: string | null
          energy_reward: number | null
          explanation: string | null
          fun_fact: string | null
          id: string | null
          options: Json | null
          question: string | null
          scheduled_date: string | null
          status: string | null
          title: string | null
          trivia_type: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          energy_reward?: number | null
          explanation?: string | null
          fun_fact?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          scheduled_date?: string | null
          status?: string | null
          title?: string | null
          trivia_type?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          energy_reward?: number | null
          explanation?: string | null
          fun_fact?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          scheduled_date?: string | null
          status?: string | null
          title?: string | null
          trivia_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_trivia_answer: {
        Args: { p_selected_answer: number; p_trivia_id: string }
        Returns: Json
      }
      get_auth_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_energy: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
