export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'designer' | 'admin'
          avatar_path: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'designer' | 'admin'
          avatar_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'designer' | 'admin'
          avatar_path?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          submission_date: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          submission_date?: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          submission_date?: string
          comment?: string | null
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          submission_id: string
          storage_path: string
          file_name: string
          file_size: number | null
          asset_type: 'image' | 'video'
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          storage_path: string
          file_name: string
          file_size?: number | null
          asset_type?: 'image' | 'video'
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          storage_path?: string
          file_name?: string
          file_size?: number | null
          asset_type?: 'image' | 'video'
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          submission_id: string
          rated_by: string
          productivity: number
          quality: number
          convertability: number
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          rated_by: string
          productivity: number
          quality: number
          convertability: number
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          rated_by?: string
          productivity?: number
          quality?: number
          convertability?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: {
          time_range?: string
        }
        Returns: {
          user_id: string
          full_name: string | null
          total_submissions: number
          avg_total_score: number
          avg_productivity: number
          avg_quality: number
          avg_convertability: number
          rank: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type Asset = Database['public']['Tables']['assets']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']

export type SubmissionWithAssets = Submission & {
  assets: Asset[]
}

export type SubmissionWithDetails = Submission & {
  assets: Asset[]
  profiles: Pick<Profile, 'full_name' | 'email'>
  ratings: (Rating & { profiles: Pick<Profile, 'full_name'> })[]
}

export type LeaderboardEntry = {
  user_id: string
  full_name: string | null
  avatar_path?: string | null
  total_submissions: number
  avg_total_score: number
  avg_productivity: number
  avg_quality: number
  avg_convertability: number
  rank: number
  trend?: 'up' | 'down' | 'same'
}
