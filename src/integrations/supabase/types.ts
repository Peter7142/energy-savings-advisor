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
      blog_posts: {
        Row: {
          content_md: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          published: boolean
          published_at: string | null
          reading_minutes: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean
          published_at?: string | null
          reading_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      okte_spot_daily: {
        Row: {
          avg_price_eur_per_mwh: number
          created_at: string
          id: string
          max_price_eur_per_mwh: number | null
          min_price_eur_per_mwh: number | null
          raw_payload: Json | null
          total_volume_mwh: number | null
          trade_date: string
        }
        Insert: {
          avg_price_eur_per_mwh: number
          created_at?: string
          id?: string
          max_price_eur_per_mwh?: number | null
          min_price_eur_per_mwh?: number | null
          raw_payload?: Json | null
          total_volume_mwh?: number | null
          trade_date: string
        }
        Update: {
          avg_price_eur_per_mwh?: number
          created_at?: string
          id?: string
          max_price_eur_per_mwh?: number | null
          min_price_eur_per_mwh?: number | null
          raw_payload?: Json | null
          total_volume_mwh?: number | null
          trade_date?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          email: string | null
          id: string
          paid_at: string | null
          product_label: string
          quote_household_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          paid_at?: string | null
          product_label?: string
          quote_household_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          paid_at?: string | null
          product_label?: string
          quote_household_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_quote_household_id_fkey"
            columns: ["quote_household_id"]
            isOneToOne: false
            referencedRelation: "quotes_household"
            referencedColumns: ["id"]
          },
        ]
      }
      price_predictions: {
        Row: {
          confidence: number | null
          expected_change_pct: number | null
          generated_at: string
          horizon: string
          id: string
          rationale: string | null
          trend: string
        }
        Insert: {
          confidence?: number | null
          expected_change_pct?: number | null
          generated_at?: string
          horizon: string
          id?: string
          rationale?: string | null
          trend: string
        }
        Update: {
          confidence?: number | null
          expected_change_pct?: number | null
          generated_at?: string
          horizon?: string
          id?: string
          rationale?: string | null
          trend?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes_business: {
        Row: {
          annual_consumption_mwh: number
          company_name: string
          consumption_type: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          current_supplier: string | null
          email_sent_at: string | null
          ico: string | null
          id: string
          notes: string | null
          preferred_product: string | null
          user_id: string | null
        }
        Insert: {
          annual_consumption_mwh: number
          company_name: string
          consumption_type?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          current_supplier?: string | null
          email_sent_at?: string | null
          ico?: string | null
          id?: string
          notes?: string | null
          preferred_product?: string | null
          user_id?: string | null
        }
        Update: {
          annual_consumption_mwh?: number
          company_name?: string
          consumption_type?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          current_supplier?: string | null
          email_sent_at?: string | null
          ico?: string | null
          id?: string
          notes?: string | null
          preferred_product?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quotes_household: {
        Row: {
          annual_consumption_kwh: number
          annual_gas_kwh: number | null
          created_at: string
          current_supplier: string | null
          current_unit_price_eur_per_kwh: number | null
          distribution_area: Database["public"]["Enums"]["distribution_area"]
          email: string | null
          estimated_savings_eur: number | null
          id: string
          includes_gas: boolean
          paid: boolean
          recommended_supplier_id: string | null
          session_token: string
          tariff_band: string | null
          user_id: string | null
        }
        Insert: {
          annual_consumption_kwh: number
          annual_gas_kwh?: number | null
          created_at?: string
          current_supplier?: string | null
          current_unit_price_eur_per_kwh?: number | null
          distribution_area: Database["public"]["Enums"]["distribution_area"]
          email?: string | null
          estimated_savings_eur?: number | null
          id?: string
          includes_gas?: boolean
          paid?: boolean
          recommended_supplier_id?: string | null
          session_token?: string
          tariff_band?: string | null
          user_id?: string | null
        }
        Update: {
          annual_consumption_kwh?: number
          annual_gas_kwh?: number | null
          created_at?: string
          current_supplier?: string | null
          current_unit_price_eur_per_kwh?: number | null
          distribution_area?: Database["public"]["Enums"]["distribution_area"]
          email?: string | null
          estimated_savings_eur?: number | null
          id?: string
          includes_gas?: boolean
          paid?: boolean
          recommended_supplier_id?: string | null
          session_token?: string
          tariff_band?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_household_recommended_supplier_id_fkey"
            columns: ["recommended_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          email: string | null
          estimated_savings_eur: number
          id: string
          instructions_md: string | null
          order_id: string | null
          pdf_url: string | null
          quote_household_id: string | null
          top_recommendations: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          estimated_savings_eur: number
          id?: string
          instructions_md?: string | null
          order_id?: string | null
          pdf_url?: string | null
          quote_household_id?: string | null
          top_recommendations: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          estimated_savings_eur?: number
          id?: string
          instructions_md?: string | null
          order_id?: string | null
          pdf_url?: string | null
          quote_household_id?: string | null
          top_recommendations?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_quote_household_id_fkey"
            columns: ["quote_household_id"]
            isOneToOne: false
            referencedRelation: "quotes_household"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          energy_types: Database["public"]["Enums"]["energy_type"][]
          id: string
          is_active: boolean
          last_scraped_at: string | null
          logo_url: string | null
          name: string
          parsing_rules: Json | null
          pricing_page_url: string | null
          segments: Database["public"]["Enums"]["customer_segment"][]
          slug: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          energy_types?: Database["public"]["Enums"]["energy_type"][]
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          logo_url?: string | null
          name: string
          parsing_rules?: Json | null
          pricing_page_url?: string | null
          segments?: Database["public"]["Enums"]["customer_segment"][]
          slug: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          energy_types?: Database["public"]["Enums"]["energy_type"][]
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          logo_url?: string | null
          name?: string
          parsing_rules?: Json | null
          pricing_page_url?: string | null
          segments?: Database["public"]["Enums"]["customer_segment"][]
          slug?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      tariff_audit: {
        Row: {
          http_status: number | null
          id: string
          raw_payload: Json
          scraped_at: string
          source_url: string | null
          supplier_id: string
          tariff_id: string | null
          validation_diff: Json | null
        }
        Insert: {
          http_status?: number | null
          id?: string
          raw_payload: Json
          scraped_at?: string
          source_url?: string | null
          supplier_id: string
          tariff_id?: string | null
          validation_diff?: Json | null
        }
        Update: {
          http_status?: number | null
          id?: string
          raw_payload?: Json
          scraped_at?: string
          source_url?: string | null
          supplier_id?: string
          tariff_id?: string | null
          validation_diff?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tariff_audit_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tariff_audit_tariff_id_fkey"
            columns: ["tariff_id"]
            isOneToOne: false
            referencedRelation: "tariffs"
            referencedColumns: ["id"]
          },
        ]
      }
      tariffs: {
        Row: {
          created_at: string
          distribution_area:
            | Database["public"]["Enums"]["distribution_area"]
            | null
          energy_type: Database["public"]["Enums"]["energy_type"]
          fixation_months: number | null
          id: string
          monthly_fee_eur: number | null
          notes: string | null
          product_name: string
          segment: Database["public"]["Enums"]["customer_segment"]
          source_url: string | null
          status: Database["public"]["Enums"]["tariff_status"]
          supplier_id: string
          tariff_band: string | null
          unit_price_eur_per_kwh: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          distribution_area?:
            | Database["public"]["Enums"]["distribution_area"]
            | null
          energy_type: Database["public"]["Enums"]["energy_type"]
          fixation_months?: number | null
          id?: string
          monthly_fee_eur?: number | null
          notes?: string | null
          product_name: string
          segment: Database["public"]["Enums"]["customer_segment"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["tariff_status"]
          supplier_id: string
          tariff_band?: string | null
          unit_price_eur_per_kwh: number
          updated_at?: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          distribution_area?:
            | Database["public"]["Enums"]["distribution_area"]
            | null
          energy_type?: Database["public"]["Enums"]["energy_type"]
          fixation_months?: number | null
          id?: string
          monthly_fee_eur?: number | null
          notes?: string | null
          product_name?: string
          segment?: Database["public"]["Enums"]["customer_segment"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["tariff_status"]
          supplier_id?: string
          tariff_band?: string | null
          unit_price_eur_per_kwh?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tariffs_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      customer_segment: "household" | "business"
      distribution_area: "ZSD" | "SSD" | "VSD"
      energy_type: "electricity" | "gas"
      order_status: "pending" | "paid" | "failed" | "refunded"
      tariff_status: "pending" | "validated" | "rejected" | "needs_review"
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
      customer_segment: ["household", "business"],
      distribution_area: ["ZSD", "SSD", "VSD"],
      energy_type: ["electricity", "gas"],
      order_status: ["pending", "paid", "failed", "refunded"],
      tariff_status: ["pending", "validated", "rejected", "needs_review"],
    },
  },
} as const
