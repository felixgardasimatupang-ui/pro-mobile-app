export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          currency: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          currency?: string
          is_admin?: boolean
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'ewallet' | 'other'
          balance: number
          icon: string
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'cash' | 'bank' | 'ewallet' | 'other'
          balance?: number
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          type?: 'cash' | 'bank' | 'ewallet' | 'other'
          balance?: number
          icon?: string
          color?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: 'income' | 'expense' | 'both'
          icon: string
          color: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: 'income' | 'expense' | 'both'
          icon?: string
          color?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          type?: 'income' | 'expense' | 'both'
          icon?: string
          color?: string
          is_active?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          wallet_id: string
          category_id: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          note: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_id: string
          category_id?: string | null
          type: 'income' | 'expense' | 'transfer'
          amount: number
          description: string
          note?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          wallet_id?: string
          category_id?: string | null
          type?: 'income' | 'expense' | 'transfer'
          amount?: number
          description?: string
          note?: string | null
          date?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount_limit: number
          period_month: number
          period_year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount_limit: number
          period_month: number
          period_year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount_limit?: number
          period_month?: number
          period_year?: number
          updated_at?: string
        }
      }
      transfers: {
        Row: {
          id: string
          user_id: string
          from_wallet_id: string
          to_wallet_id: string
          amount: number
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_wallet_id: string
          to_wallet_id: string
          amount: number
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          amount?: number
          description?: string | null
          date?: string
        }
      }
    }
    Views: {
      monthly_summary: {
        Row: {
          user_id: string
          month: string
          total_income: number
          total_expense: number
          transaction_count: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
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

export const Constants = {
  public: { Enums: {} },
} as const
