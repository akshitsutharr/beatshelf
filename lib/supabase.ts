import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          updated_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          name: string
          artist_name: string
          album_name: string
          album_image_url: string | null
          preview_url: string | null
          duration_ms: number | null
          release_date: string | null
          spotify_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          artist_name: string
          album_name: string
          album_image_url?: string | null
          preview_url?: string | null
          duration_ms?: number | null
          release_date?: string | null
          spotify_url?: string | null
        }
        Update: {
          name?: string
          artist_name?: string
          album_name?: string
          album_image_url?: string | null
          preview_url?: string | null
          duration_ms?: number | null
          release_date?: string | null
          spotify_url?: string | null
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          song_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          song_id: string
          content: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          song_id: string
          rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          song_id: string
          rating: number
        }
        Update: {
          rating?: number
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          song_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          song_id: string
        }
      }
    }
  }
}
