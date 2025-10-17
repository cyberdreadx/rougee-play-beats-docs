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
      ads: {
        Row: {
          active: boolean | null
          audio_cid: string
          created_at: string | null
          duration: number
          id: string
          image_cid: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          audio_cid: string
          created_at?: string | null
          duration?: number
          id?: string
          image_cid?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          audio_cid?: string
          created_at?: string | null
          duration?: number
          id?: string
          image_cid?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      feed_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          comment_count: number | null
          content_text: string | null
          created_at: string
          id: string
          like_count: number | null
          media_cid: string | null
          media_type: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          comment_count?: number | null
          content_text?: string | null
          created_at?: string
          id?: string
          like_count?: number | null
          media_cid?: string | null
          media_type?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          comment_count?: number | null
          content_text?: string | null
          created_at?: string
          id?: string
          like_count?: number | null
          media_cid?: string | null
          media_type?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          song_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position: number
          song_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_cid: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          token_address: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          cover_cid?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          token_address?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          cover_cid?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          token_address?: string | null
          updated_at?: string
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
          email: string | null
          email_notifications: boolean | null
          id: string
          profile_metadata_cid: string | null
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
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          profile_metadata_cid?: string | null
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
          email?: string | null
          email_notifications?: boolean | null
          id?: string
          profile_metadata_cid?: string | null
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
          token_address: string | null
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
          token_address?: string | null
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
          token_address?: string | null
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
          like_count: number | null
          media_path: string
          media_type: string
          updated_at: string
          view_count: number | null
          wallet_address: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          file_size: number
          id?: string
          like_count?: number | null
          media_path?: string
          media_type: string
          updated_at?: string
          view_count?: number | null
          wallet_address: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          file_size?: number
          id?: string
          like_count?: number | null
          media_path?: string
          media_type?: string
          updated_at?: string
          view_count?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_wallet_address: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_wallet_address: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_ip_logs: {
        Row: {
          action: string
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: unknown
          user_agent: string | null
          wallet_address: string
        }
        Insert: {
          action: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          user_agent?: string | null
          wallet_address: string
        }
        Update: {
          action?: string
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          artist_name: string | null
          artist_ticker: string | null
          avatar_cid: string | null
          avatar_url: string | null
          bio: string | null
          cover_cid: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          social_links: Json | null
          ticker_created_at: string | null
          total_plays: number | null
          total_songs: number | null
          updated_at: string | null
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
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          social_links?: Json | null
          ticker_created_at?: string | null
          total_plays?: number | null
          total_songs?: number | null
          updated_at?: string | null
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
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          social_links?: Json | null
          ticker_created_at?: string | null
          total_plays?: number | null
          total_songs?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          wallet_address?: string | null
        }
        Relationships: []
      }
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
      get_ips_by_wallet: {
        Args: { check_wallet: string }
        Returns: {
          connection_count: number
          countries: string[]
          first_seen: string
          ip_address: unknown
          last_seen: string
        }[]
      }
      get_song_like_count: {
        Args: { p_song_id: string }
        Returns: number
      }
      get_wallet_from_jwt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_wallets_by_ip: {
        Args: { check_ip: unknown }
        Returns: {
          connection_count: number
          first_seen: string
          last_seen: string
          wallet_address: string
        }[]
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
      sync_feed_comment_count: {
        Args: { p_post_id: string }
        Returns: undefined
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
