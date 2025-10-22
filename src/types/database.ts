// Supabase Database Types

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
      generations: {
        Row: {
          id: string
          user_id: string
          task_id: string
          prompt: string
          model: string
          instrumental: boolean
          vocal_gender: string | null
          negative_tags: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          prompt: string
          model: string
          instrumental?: boolean
          vocal_gender?: string | null
          negative_tags?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          prompt?: string
          model?: string
          instrumental?: boolean
          vocal_gender?: string | null
          negative_tags?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          generation_id: string
          suno_id: string
          title: string
          tags: string
          prompt: string
          model_name: string
          audio_url: string
          source_audio_url: string
          stream_audio_url: string
          image_url: string
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          generation_id: string
          suno_id: string
          title: string
          tags: string
          prompt: string
          model_name: string
          audio_url: string
          source_audio_url: string
          stream_audio_url: string
          image_url: string
          duration: number
          created_at?: string
        }
        Update: {
          id?: string
          generation_id?: string
          suno_id?: string
          title?: string
          tags?: string
          prompt?: string
          model_name?: string
          audio_url?: string
          source_audio_url?: string
          stream_audio_url?: string
          image_url?: string
          duration?: number
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          avatar_url: string | null
          credits_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          avatar_url?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          avatar_url?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      generation_status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
}

