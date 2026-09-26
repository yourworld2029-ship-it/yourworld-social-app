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
      calls: {
        Row: {
          call_type: string | null
          caller_id: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          receiver_id: string | null
          signal_data: Json | null
          status: string | null
        }
        Insert: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          receiver_id?: string | null
          signal_data?: Json | null
          status?: string | null
        }
        Update: {
          call_type?: string | null
          caller_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          receiver_id?: string | null
          signal_data?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      channels: {
        Row: {
          banner_url: string | null
          channel_name: string
          created_at: string | null
          description: string | null
          id: string
          is_monetized: boolean | null
          subscribers_count: number | null
          user_id: string | null
        }
        Insert: {
          banner_url?: string | null
          channel_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_monetized?: boolean | null
          subscribers_count?: number | null
          user_id?: string | null
        }
        Update: {
          banner_url?: string | null
          channel_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_monetized?: boolean | null
          subscribers_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number
          parent_comment_id: string | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          auto_delete_setting: string
          created_at: string | null
          id: string
          participant_one_id: string | null
          participant_two_id: string | null
          thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_delete_setting?: string
          created_at?: string | null
          id?: string
          participant_one_id?: string | null
          participant_two_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_delete_setting?: string
          created_at?: string | null
          id?: string
          participant_one_id?: string | null
          participant_two_id?: string | null
          thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          auto_delete_setting: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          is_viewed: boolean
          media_type: string
          media_url: string | null
          sender_id: string
          thread_id: string
          viewed_at: string | null
        }
        Insert: {
          auto_delete_setting?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_viewed?: boolean
          media_type?: string
          media_url?: string | null
          sender_id: string
          thread_id: string
          viewed_at?: string | null
        }
        Update: {
          auto_delete_setting?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_viewed?: boolean
          media_type?: string
          media_url?: string | null
          sender_id?: string
          thread_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          auto_delete_mode: string
          auto_delete_setting: string
          content: string | null
          conversation_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_deleted: boolean
          is_read: boolean | null
          is_system_message: boolean
          is_viewed: boolean
          media_url: string | null
          metadata: Json
          receiver_id: string | null
          sender_id: string | null
          viewed_at: string | null
          voice_note_url: string | null
        }
        Insert: {
          auto_delete_mode?: string
          auto_delete_setting?: string
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean | null
          is_system_message?: boolean
          is_viewed?: boolean
          media_url?: string | null
          metadata?: Json
          receiver_id?: string | null
          sender_id?: string | null
          viewed_at?: string | null
          voice_note_url?: string | null
        }
        Update: {
          auto_delete_mode?: string
          auto_delete_setting?: string
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
          is_read?: boolean | null
          is_system_message?: boolean
          is_viewed?: boolean
          media_url?: string | null
          metadata?: Json
          receiver_id?: string | null
          sender_id?: string | null
          viewed_at?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_likes: {
        Row: {
          created_at: string
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: []
      }
      monetization: {
        Row: {
          created_at: string | null
          earnings_total: number | null
          id: string
          payment_method: string | null
          pending_payout: number | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          earnings_total?: number | null
          id?: string
          payment_method?: string | null
          pending_payout?: number | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          earnings_total?: number | null
          id?: string
          payment_method?: string | null
          pending_payout?: number | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          metadata: Json
          read: boolean
          recipient_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          metadata?: Json
          read?: boolean
          recipient_id: string
          title: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          metadata?: Json
          read?: boolean
          recipient_id?: string
          title?: string
        }
        Relationships: []
      }
      orbit_chat_requests: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          intro: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          intro?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          intro?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      orbit_chat_settings: {
        Row: {
          auto_delete_mode: string
          auto_delete_seconds: number
          auto_delete_setting: string
          blocked: boolean
          cleared_before: string | null
          display_name: string | null
          muted: boolean
          peer_id: string
          recording_alert: boolean
          screenshot_alert: boolean
          secret_lock_enabled: boolean
          secret_pin_hash: string | null
          secret_pin_salt: string | null
          updated_at: string
          user_id: string
          view_once_mode: boolean
        }
        Insert: {
          auto_delete_mode?: string
          auto_delete_seconds?: number
          auto_delete_setting?: string
          blocked?: boolean
          cleared_before?: string | null
          display_name?: string | null
          muted?: boolean
          peer_id: string
          recording_alert?: boolean
          screenshot_alert?: boolean
          secret_lock_enabled?: boolean
          secret_pin_hash?: string | null
          secret_pin_salt?: string | null
          updated_at?: string
          user_id: string
          view_once_mode?: boolean
        }
        Update: {
          auto_delete_mode?: string
          auto_delete_seconds?: number
          auto_delete_setting?: string
          blocked?: boolean
          cleared_before?: string | null
          display_name?: string | null
          muted?: boolean
          peer_id?: string
          recording_alert?: boolean
          screenshot_alert?: boolean
          secret_lock_enabled?: boolean
          secret_pin_hash?: string | null
          secret_pin_salt?: string | null
          updated_at?: string
          user_id?: string
          view_once_mode?: boolean
        }
        Relationships: []
      }
      orbit_messages: {
        Row: {
          auto_delete_setting: string
          created_at: string
          expires_at: string | null
          id: string
          is_viewed: boolean
          kind: string
          recipient_id: string
          sender_id: string
          text: string | null
          updated_at: string
          url: string | null
          view_once: boolean
          viewed_at: string | null
        }
        Insert: {
          auto_delete_setting?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_viewed?: boolean
          kind?: string
          recipient_id: string
          sender_id: string
          text?: string | null
          updated_at?: string
          url?: string | null
          view_once?: boolean
          viewed_at?: string | null
        }
        Update: {
          auto_delete_setting?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_viewed?: boolean
          kind?: string
          recipient_id?: string
          sender_id?: string
          text?: string | null
          updated_at?: string
          url?: string | null
          view_once?: boolean
          viewed_at?: string | null
        }
        Relationships: []
      }
      orbit_profiles: {
        Row: {
          about: string
          age: number
          city: string
          country: string
          created_at: string
          gender: string
          hobbies: string[]
          looking_for: string
          mood: string | null
          name: string
          orbit_enabled: boolean
          original_photo_privacy: string
          photos: Json
          state: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          about?: string
          age?: number
          city?: string
          country?: string
          created_at?: string
          gender?: string
          hobbies?: string[]
          looking_for?: string
          mood?: string | null
          name: string
          orbit_enabled?: boolean
          original_photo_privacy?: string
          photos?: Json
          state?: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          about?: string
          age?: number
          city?: string
          country?: string
          created_at?: string
          gender?: string
          hobbies?: string[]
          looking_for?: string
          mood?: string | null
          name?: string
          orbit_enabled?: boolean
          original_photo_privacy?: string
          photos?: Json
          state?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      orbit_request_messages: {
        Row: {
          created_at: string
          id: string
          kind: string
          request_id: string
          sender_id: string
          text: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          request_id: string
          sender_id: string
          text?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          request_id?: string
          sender_id?: string
          text?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orbit_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "orbit_chat_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      post_saves: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          allow_download: boolean
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          kind: string | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          original_height: number | null
          original_width: number | null
          price: number | null
          source_quality_tier: string | null
          thumbnail_url: string | null
          user_id: string | null
          video_access: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          allow_download?: boolean
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          kind?: string | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          original_height?: number | null
          original_width?: number | null
          price?: number | null
          source_quality_tier?: string | null
          thumbnail_url?: string | null
          user_id?: string | null
          video_access?: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          allow_download?: boolean
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          kind?: string | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          original_height?: number | null
          original_width?: number | null
          price?: number | null
          source_quality_tier?: string | null
          thumbnail_url?: string | null
          user_id?: string | null
          video_access?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          category: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number
          following_count: number
          full_name: string | null
          id: string
          is_verified: boolean | null
          two_factor_enabled: boolean
          updated_at: string | null
          username: string | null
          verification_requested: boolean | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number
          following_count?: number
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          two_factor_enabled?: boolean
          updated_at?: string | null
          username?: string | null
          verification_requested?: boolean | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          two_factor_enabled?: boolean
          updated_at?: string | null
          username?: string | null
          verification_requested?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_name: string
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          location_city: string | null
          revoked_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location_city?: string | null
          revoked_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location_city?: string | null
          revoked_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      sports_verification_details: {
        Row: {
          address: string
          certificate_number: string
          certificate_number_normalized: string | null
          country: string
          created_at: string
          date_of_birth: string | null
          district: string
          email: string
          father_name: string
          full_name: string
          identity_details_confirmed: boolean
          identity_key: string | null
          mobile_number: string
          passport_number: string
          passport_number_normalized: string | null
          passport_first_page_path: string | null
          passport_visa_stamp_page_path: string | null
          sports_certificate_path: string | null
          state: string
          tournament_photo_path: string | null
          updated_at: string
          user_id: string
          village_town: string
          review_status: string
          review_reason: string | null
          submitted_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          address?: string
          certificate_number?: string
          country?: string
          created_at?: string
          date_of_birth?: string | null
          district?: string
          email?: string
          father_name?: string
          full_name?: string
          identity_details_confirmed?: boolean
          mobile_number?: string
          passport_number?: string
          passport_first_page_path?: string | null
          passport_visa_stamp_page_path?: string | null
          sports_certificate_path?: string | null
          state?: string
          tournament_photo_path?: string | null
          updated_at?: string
          user_id: string
          village_town?: string
          review_status?: string
          review_reason?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          address?: string
          certificate_number?: string
          country?: string
          created_at?: string
          date_of_birth?: string | null
          district?: string
          email?: string
          father_name?: string
          full_name?: string
          identity_details_confirmed?: boolean
          mobile_number?: string
          passport_number?: string
          passport_first_page_path?: string | null
          passport_visa_stamp_page_path?: string | null
          sports_certificate_path?: string | null
          state?: string
          tournament_photo_path?: string | null
          updated_at?: string
          user_id?: string
          village_town?: string
          review_status?: string
          review_reason?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_verification_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      thread_participants: {
        Row: {
          created_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      unique_views: {
        Row: {
          content_id: string
          content_type: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          content_id: string
          content_type: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          reason: string
          reported_user_id: string
          reporter_id: string
          surface: string
          thread_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id: string
          reporter_id: string
          surface: string
          thread_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          surface?: string
          thread_id?: string | null
        }
        Relationships: []
      }
      video_access_grants: {
        Row: {
          access_type: string
          amount_paid: number
          created_at: string
          expires_at: string | null
          granted_by: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          access_type: string
          amount_paid?: number
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          access_type?: string
          amount_paid?: number
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_access_grants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      burn_view_once: { Args: { _msg_id: string }; Returns: boolean }
      current_user_session_is_active: { Args: never; Returns: boolean }
      clear_orbit_conversation: {
        Args: { _peer_id: string }
        Returns: undefined
      }
      clear_social_conversation: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      consume_orbit_view_once: { Args: { _msg_id: string }; Returns: string }
      delete_expired_chat_messages: { Args: never; Returns: number }
      delete_expired_orbit_messages: { Args: never; Returns: number }
      discover_orbit_profiles: {
        Args: { ids?: string[] }
        Returns: {
          about: string
          age: number
          city: string
          country: string
          gender: string
          hobbies: string[]
          looking_for: string
          mood: string
          name: string
          orbit_enabled: boolean
          original_photo_privacy: string
          photos: Json
          state: string
          updated_at: string
          user_id: string
          visible: boolean
        }[]
      }
      dm_thread_has_user: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      dm_thread_id: { Args: { _a: string; _b: string }; Returns: string }
      dm_thread_peer: {
        Args: { _thread_id: string; _user_id: string }
        Returns: string
      }
      get_follow_counts: {
        Args: { ids: string[] }
        Returns: {
          followers: number
          following: number
          id: string
        }[]
      }
      get_public_profiles: {
        Args: { ids: string[] }
        Returns: {
          avatar_url: string
          bio: string
          category: string
          display_name: string
          id: string
          is_verified: boolean
          username: string
        }[]
      }
      list_follows: {
        Args: { _kind: string; _limit?: number; _user_id: string }
        Returns: {
          created_at: string
          id: string
        }[]
      }
      list_current_user_sessions: {
        Args: never
        Returns: {
          created_at: string
          device_name: string
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          location_city: string | null
        }[]
      }
      register_current_user_session: {
        Args: {
          _device_name?: string
          _ip_address?: string | null
          _location_city?: string | null
        }
        Returns: {
          created_at: string
          device_name: string
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          location_city: string | null
          revoked_at: string | null
          session_id: string
          user_id: string
        }[]
      }
      register_unique_view: {
        Args: { _content_id: string; _content_type: string }
        Returns: boolean
      }
      respond_to_orbit_chat_request: {
        Args: { _status: string; _target_id: string }
        Returns: boolean
      }
      revoke_other_user_sessions: { Args: never; Returns: number }
      revoke_user_session: {
        Args: { _session_row_id: string }
        Returns: boolean
      }
      search_profiles: {
        Args: { search: string }
        Returns: {
          avatar_url: string
          bio: string
          category: string
          display_name: string
          id: string
          is_verified: boolean
          username: string
        }[]
      }
      send_orbit_chat_request: {
        Args: { _intro?: string; _target_id: string }
        Returns: string
      }
      send_orbit_request_message: {
        Args: {
          _kind: string
          _target_id: string
          _text?: string
          _url?: string
        }
        Returns: string
      }
      set_follow: {
        Args: { _following_id: string; _on: boolean }
        Returns: {
          followers: number
          following: boolean
          following_count: number
        }[]
      }
      users_blocked: { Args: { _a: string; _b: string }; Returns: boolean }
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
