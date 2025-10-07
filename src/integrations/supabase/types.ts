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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      artist_tokens: {
        Row: {
          chain_id: number
          contract_address: string
          created_at: string
          id: string
          token_name: string
          token_symbol: string
          total_supply: string
          wallet_address: string
        }
        Insert: {
          chain_id?: number
          contract_address: string
          created_at?: string
          id?: string
          token_name: string
          token_symbol: string
          total_supply: string
          wallet_address: string
        }
        Update: {
          chain_id?: number
          contract_address?: string
          created_at?: string
          id?: string
          token_name?: string
          token_symbol?: string
          total_supply?: string
          wallet_address?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          song_id: string
          updated_at: string
          user_name: string | null
          wallet_address: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          song_id: string
          updated_at?: string
          user_name?: string | null
          wallet_address: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          song_id?: string
          updated_at?: string
          user_name?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_violations: {
        Row: {
          acr_response: Json | null
          album: string | null
          artist_name: string | null
          created_at: string
          detected_at: string
          file_name: string | null
          id: string
          label: string | null
          song_title: string | null
          wallet_address: string
        }
        Insert: {
          acr_response?: Json | null
          album?: string | null
          artist_name?: string | null
          created_at?: string
          detected_at?: string
          file_name?: string | null
          id?: string
          label?: string | null
          song_title?: string | null
          wallet_address: string
        }
        Update: {
          acr_response?: Json | null
          album?: string | null
          artist_name?: string | null
          created_at?: string
          detected_at?: string
          file_name?: string | null
          id?: string
          label?: string | null
          song_title?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          artist_name: string | null
          artist_ticker: string | null
          avatar_cid: string | null
          avatar_url: string | null
          bio: string | null
          cover_cid: string | null
          created_at: string
          display_name: string | null
          id: string
          profile_metadata_cid: string | null
          role: string
          social_links: Json | null
          ticker_created_at: string | null
          total_plays: number | null
          total_songs: number | null
          updated_at: string
          user_id: string | null
          verified: boolean | null
          wallet_address: string | null
        }
        Insert: {
          artist_name?: string | null
          artist_ticker?: string | null
          avatar_cid?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_cid?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_metadata_cid?: string | null
          role: string
          social_links?: Json | null
          ticker_created_at?: string | null
          total_plays?: number | null
          total_songs?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          wallet_address?: string | null
        }
        Update: {
          artist_name?: string | null
          artist_ticker?: string | null
          avatar_cid?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_cid?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          profile_metadata_cid?: string | null
          role?: string
          social_links?: Json | null
          ticker_created_at?: string | null
          total_plays?: number | null
          total_songs?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      song_likes: {
        Row: {
          created_at: string
          id: string
          song_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_likes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_purchases: {
        Row: {
          artist_wallet_address: string
          buyer_wallet_address: string
          created_at: string
          id: string
          purchased_at: string
          song_id: string
        }
        Insert: {
          artist_wallet_address: string
          buyer_wallet_address: string
          created_at?: string
          id?: string
          purchased_at?: string
          song_id: string
        }
        Update: {
          artist_wallet_address?: string
          buyer_wallet_address?: string
          created_at?: string
          id?: string
          purchased_at?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_purchases_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          report_type: Database["public"]["Enums"]["report_type"]
          song_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          report_type: Database["public"]["Enums"]["report_type"]
          song_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          song_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_reports_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          artist: string | null
          audio_cid: string
          cover_cid: string | null
          created_at: string
          description: string | null
          duration: number | null
          genre: string | null
          id: string
          play_count: number
          ticker: string | null
          title: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          artist?: string | null
          audio_cid: string
          cover_cid?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          play_count?: number
          ticker?: string | null
          title: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          artist?: string | null
          audio_cid?: string
          cover_cid?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          play_count?: number
          ticker?: string | null
          title?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          file_size: number
          id: string
          media_path: string
          media_type: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          file_size: number
          id?: string
          media_path?: string
          media_type: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          file_size?: number
          id?: string
          media_path?: string
          media_type?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          wallet_address?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_stories: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_holders_count: {
        Args: { artist_wallet: string }
        Returns: number
      }
      get_holdings_count: {
        Args: { buyer_wallet: string }
        Returns: number
      }
      get_song_like_count: {
        Args: { p_song_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_by_wallet: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _wallet_address: string
        }
        Returns: boolean
      }
      has_user_liked_song: {
        Args: { p_song_id: string; p_wallet_address: string }
        Returns: boolean
      }
      increment_play_count: {
        Args: { song_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { check_wallet: string }
        Returns: boolean
      }
      is_ticker_available: {
        Args: { ticker: string }
        Returns: boolean
      }
      update_artist_stats: {
        Args: { artist_wallet: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "artist" | "listener"
      report_type: "copyright" | "hate_speech" | "other"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "artist", "listener"],
      report_type: ["copyright", "hate_speech", "other"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
