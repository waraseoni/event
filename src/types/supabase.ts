export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// GENERATED FILE - do not edit by hand.
// Source: supabase/schema.sql
// Regenerate: node supabase/validation/gen-types.js
// (equivalent: npm run supabase:gen:offline, or `supabase:gen` when the
//  Supabase CLI is authenticated against the project)

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string
          staff_id: string
          date: string
          status: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff' | null
          hours: number | null
          event_id: string | null
          notes: string | null
          marked_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          date: string
          status?: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff' | null
          hours?: number | null
          event_id?: string | null
          notes?: string | null
          marked_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          status?: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff' | null
          hours?: number | null
          event_id?: string | null
          notes?: string | null
          marked_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bonuses: {
        Row: {
          id: string
          staff_id: string
          type: 'performance' | 'festival' | 'referral' | 'custom'
          amount: number
          formula: string | null
          event_id: string | null
          date: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          type: 'performance' | 'festival' | 'referral' | 'custom'
          amount?: number
          formula?: string | null
          event_id?: string | null
          date?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          type?: 'performance' | 'festival' | 'referral' | 'custom'
          amount?: number
          formula?: string | null
          event_id?: string | null
          date?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonuses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonuses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          id: string
          staff_id: string
          basis: 'event_revenue' | 'event_profit' | 'payment_collected'
          percent: number
          slabs: Json | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          basis: 'event_revenue' | 'event_profit' | 'payment_collected'
          percent?: number
          slabs?: Json | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          basis?: 'event_revenue' | 'event_profit' | 'payment_collected'
          percent?: number
          slabs?: Json | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          id: string
          created_at: string | null
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'worker'
          phone: string
          email: string | null
          address: string | null
          company_name: string | null
          gst_number: string | null
          notes: string | null
          updated_at: string | null
          segment: string | null
          credit_days: number | null
          contact_person: string | null
          follow_up_date: string | null
          source: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'worker'
          phone: string
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          notes?: string | null
          updated_at?: string | null
          segment?: string | null
          credit_days?: number | null
          contact_person?: string | null
          follow_up_date?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          type?: 'vendor' | 'renter' | 'customer' | 'worker'
          phone?: string
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          notes?: string | null
          updated_at?: string | null
          segment?: string | null
          credit_days?: number | null
          contact_person?: string | null
          follow_up_date?: string | null
          source?: string | null
        }
        Relationships: []
      }
      event_expenses: {
        Row: {
          id: string
          event_id: string
          category: string | null
          description: string | null
          amount: number
          paid_to: string | null
          payment_ref: string | null
          is_paid: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          category?: string | null
          description?: string | null
          amount?: number
          paid_to?: string | null
          payment_ref?: string | null
          is_paid?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          category?: string | null
          description?: string | null
          amount?: number
          paid_to?: string | null
          payment_ref?: string | null
          is_paid?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_expenses_paid_to_fkey"
            columns: ["paid_to"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_items: {
        Row: {
          event_id: string
          inventory_item_id: string
          rental_days: number
          rental_start_date: string
          rental_end_date: string
          unit_rate: number
          total_amount: number
          notes: string | null
          id: string
          quantity: number
          status: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          created_at: string | null
          updated_at: string | null
          quote_item_id: string | null
          source: 'own' | 'rented_in' | null
          cost_line: number | null
          pickup_datetime: string | null
          return_datetime: string | null
          picked_qty: number | null
          returned_qty: number | null
          damaged_qty: number | null
        }
        Insert: {
          event_id: string
          inventory_item_id: string
          rental_days: number
          rental_start_date: string
          rental_end_date: string
          unit_rate: number
          total_amount: number
          notes?: string | null
          id?: string
          quantity?: number
          status?: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          created_at?: string | null
          updated_at?: string | null
          quote_item_id?: string | null
          source?: 'own' | 'rented_in' | null
          cost_line?: number | null
          pickup_datetime?: string | null
          return_datetime?: string | null
          picked_qty?: number | null
          returned_qty?: number | null
          damaged_qty?: number | null
        }
        Update: {
          event_id?: string
          inventory_item_id?: string
          rental_days?: number
          rental_start_date?: string
          rental_end_date?: string
          unit_rate?: number
          total_amount?: number
          notes?: string | null
          id?: string
          quantity?: number
          status?: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          created_at?: string | null
          updated_at?: string | null
          quote_item_id?: string | null
          source?: 'own' | 'rented_in' | null
          cost_line?: number | null
          pickup_datetime?: string | null
          return_datetime?: string | null
          picked_qty?: number | null
          returned_qty?: number | null
          damaged_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_items_quote"
            columns: ["quote_item_id"]
            isOneToOne: false
            referencedRelation: "quote_items"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          id: string
          event_id: string
          staff_id: string
          role: string | null
          wage_basis: 'daily_wage' | 'salary' | 'fixed' | null
          wage_per_day: number | null
          days: number
          ot_hours: number | null
          ot_rate: number | null
          total_wages: number | null
          status: 'assigned' | 'working' | 'completed' | 'cancelled' | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          staff_id: string
          role?: string | null
          wage_basis?: 'daily_wage' | 'salary' | 'fixed' | null
          wage_per_day?: number | null
          days?: number
          ot_hours?: number | null
          ot_rate?: number | null
          total_wages?: number | null
          status?: 'assigned' | 'working' | 'completed' | 'cancelled' | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          staff_id?: string
          role?: string | null
          wage_basis?: 'daily_wage' | 'salary' | 'fixed' | null
          wage_per_day?: number | null
          days?: number
          ot_hours?: number | null
          ot_rate?: number | null
          total_wages?: number | null
          status?: 'assigned' | 'working' | 'completed' | 'cancelled' | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tasks: {
        Row: {
          id: string
          event_id: string
          title: string | null
          description: string | null
          assignee: string | null
          status: 'todo' | 'doing' | 'done' | null
          priority: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          title?: string | null
          description?: string | null
          assignee?: string | null
          status?: 'todo' | 'doing' | 'done' | null
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          title?: string | null
          description?: string | null
          assignee?: string | null
          status?: 'todo' | 'doing' | 'done' | null
          priority?: 'low' | 'medium' | 'high' | 'urgent' | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          name: string
          customer_id: string
          event_type: string
          event_date: string
          end_date: string | null
          venue_address: string | null
          notes: string | null
          id: string
          status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount: number | null
          total_expenses: number | null
          profit_loss: number | null
          created_at: string | null
          updated_at: string | null
          event_no: string | null
          quote_id: string | null
          start_datetime: string | null
          venue: string | null
          client_advance: number | null
          tax_mode: 'none' | 'gst' | null
          subtotal: number | null
          tax_amount: number | null
          created_by: string | null
        }
        Insert: {
          name: string
          customer_id: string
          event_type: string
          event_date: string
          end_date?: string | null
          venue_address?: string | null
          notes?: string | null
          id?: string
          status?: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount?: number | null
          total_expenses?: number | null
          profit_loss?: number | null
          created_at?: string | null
          updated_at?: string | null
          event_no?: string | null
          quote_id?: string | null
          start_datetime?: string | null
          venue?: string | null
          client_advance?: number | null
          tax_mode?: 'none' | 'gst' | null
          subtotal?: number | null
          tax_amount?: number | null
          created_by?: string | null
        }
        Update: {
          name?: string
          customer_id?: string
          event_type?: string
          event_date?: string
          end_date?: string | null
          venue_address?: string | null
          notes?: string | null
          id?: string
          status?: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount?: number | null
          total_expenses?: number | null
          profit_loss?: number | null
          created_at?: string | null
          updated_at?: string | null
          event_no?: string | null
          quote_id?: string | null
          start_datetime?: string | null
          venue?: string | null
          client_advance?: number | null
          tax_mode?: 'none' | 'gst' | null
          subtotal?: number | null
          tax_amount?: number | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_quote"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          id: string
          category: string | null
          description: string | null
          amount: number
          paid_via: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | null
          paid_to: string | null
          reference: string | null
          date: string
          is_event: boolean | null
          event_id: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          category?: string | null
          description?: string | null
          amount?: number
          paid_via?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | null
          paid_to?: string | null
          reference?: string | null
          date?: string
          is_event?: boolean | null
          event_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          category?: string | null
          description?: string | null
          amount?: number
          paid_via?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card' | null
          paid_to?: string | null
          reference?: string | null
          date?: string
          is_event?: boolean | null
          event_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_to_fkey"
            columns: ["paid_to"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      external_rentals: {
        Row: {
          vendor_id: string
          event_id: string | null
          item_name: string
          description: string | null
          rental_start_date: string
          rental_end_date: string
          rental_days: number
          unit_rate: number
          total_amount: number
          security_deposit: number | null
          notes: string | null
          id: string
          quantity: number
          status: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          vendor_id: string
          event_id?: string | null
          item_name: string
          description?: string | null
          rental_start_date: string
          rental_end_date: string
          rental_days: number
          unit_rate: number
          total_amount: number
          security_deposit?: number | null
          notes?: string | null
          id?: string
          quantity?: number
          status?: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          vendor_id?: string
          event_id?: string | null
          item_name?: string
          description?: string | null
          rental_start_date?: string
          rental_end_date?: string
          rental_days?: number
          unit_rate?: number
          total_amount?: number
          security_deposit?: number | null
          notes?: string | null
          id?: string
          quantity?: number
          status?: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_rentals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_rentals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          name: string
          category: string
          description: string | null
          serial_number: string | null
          unique_code: string
          purchase_date: string | null
          purchase_price: number | null
          condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          location: string | null
          id: string
          total_quantity: number
          available_quantity: number
          unit: string
          status: 'available' | 'rented' | 'maintenance' | 'retired'
          created_at: string | null
          updated_at: string | null
          category_id: string | null
          company: string | null
          model: string | null
          scope: string | null
          item_type: 'owned' | 'leased' | null
          target_event_types: string[] | null
          estimated_rent_price: number | null
          min_price: number | null
          security_deposit: number | null
          hsn_code: string | null
          images: string[] | null
          reorder_level: number | null
          location_id: string | null
          owned_quantity: number | null
        }
        Insert: {
          name: string
          category: string
          description?: string | null
          serial_number?: string | null
          unique_code: string
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          location?: string | null
          id?: string
          total_quantity?: number
          available_quantity?: number
          unit?: string
          status?: 'available' | 'rented' | 'maintenance' | 'retired'
          created_at?: string | null
          updated_at?: string | null
          category_id?: string | null
          company?: string | null
          model?: string | null
          scope?: string | null
          item_type?: 'owned' | 'leased' | null
          target_event_types?: string[] | null
          estimated_rent_price?: number | null
          min_price?: number | null
          security_deposit?: number | null
          hsn_code?: string | null
          images?: string[] | null
          reorder_level?: number | null
          location_id?: string | null
          owned_quantity?: number | null
        }
        Update: {
          name?: string
          category?: string
          description?: string | null
          serial_number?: string | null
          unique_code?: string
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          location?: string | null
          id?: string
          total_quantity?: number
          available_quantity?: number
          unit?: string
          status?: 'available' | 'rented' | 'maintenance' | 'retired'
          created_at?: string | null
          updated_at?: string | null
          category_id?: string | null
          company?: string | null
          model?: string | null
          scope?: string | null
          item_type?: 'owned' | 'leased' | null
          target_event_types?: string[] | null
          estimated_rent_price?: number | null
          min_price?: number | null
          security_deposit?: number | null
          hsn_code?: string | null
          images?: string[] | null
          reorder_level?: number | null
          location_id?: string | null
          owned_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_location"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "item_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string | null
          hsn: string | null
          qty: number | null
          rate: number
          amount: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          description?: string | null
          hsn?: string | null
          qty?: number | null
          rate?: number
          amount?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string | null
          hsn?: string | null
          qty?: number | null
          rate?: number
          amount?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          invoice_no: string
          event_id: string | null
          client_id: string
          quote_id: string | null
          issue_date: string
          due_date: string | null
          subtotal: number | null
          discount_amount: number | null
          cgst: number | null
          sgst: number | null
          igst: number | null
          round_off: number | null
          tds: number | null
          grand_total: number
          amount_paid: number | null
          amount_due: number
          tax_mode: 'none' | 'gst' | null
          status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | null
          pdf_url: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          invoice_no: string
          event_id?: string | null
          client_id: string
          quote_id?: string | null
          issue_date?: string
          due_date?: string | null
          subtotal?: number | null
          discount_amount?: number | null
          cgst?: number | null
          sgst?: number | null
          igst?: number | null
          round_off?: number | null
          tds?: number | null
          grand_total?: number
          amount_paid?: number | null
          amount_due?: number
          tax_mode?: 'none' | 'gst' | null
          status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | null
          pdf_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          invoice_no?: string
          event_id?: string | null
          client_id?: string
          quote_id?: string | null
          issue_date?: string
          due_date?: string | null
          subtotal?: number | null
          discount_amount?: number | null
          cgst?: number | null
          sgst?: number | null
          igst?: number | null
          round_off?: number | null
          tds?: number | null
          grand_total?: number
          amount_paid?: number | null
          amount_due?: number
          tax_mode?: 'none' | 'gst' | null
          status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | null
          pdf_url?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          icon: string | null
          sort_order: number | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          icon?: string | null
          sort_order?: number | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      item_locations: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      item_serials: {
        Row: {
          id: string
          item_id: string
          serial_code: string
          qr_code: string | null
          condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          status: 'available' | 'rented' | 'maintenance' | 'retired' | null
          assigned_to: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          serial_code: string
          qr_code?: string | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          status?: 'available' | 'rented' | 'maintenance' | 'retired' | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          serial_code?: string
          qr_code?: string | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          status?: 'available' | 'rented' | 'maintenance' | 'retired' | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_serials_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_serials_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          id: string
          item_id: string
          maintenance_type: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other' | null
          description: string | null
          cost: number | null
          vendor_id: string | null
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          maintenance_type?: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other' | null
          description?: string | null
          cost?: number | null
          vendor_id?: string | null
          started_at: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          maintenance_type?: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other' | null
          description?: string | null
          cost?: number | null
          vendor_id?: string | null
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          type: 'info' | 'warning' | 'success' | 'alert' | null
          entity_type: string | null
          entity_id: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body?: string | null
          type?: 'info' | 'warning' | 'success' | 'alert' | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          type?: 'info' | 'warning' | 'success' | 'alert' | null
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          contact_id: string | null
          event_id: string | null
          type: 'incoming' | 'outgoing'
          category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount: number
          payment_date: string
          payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number: string | null
          notes: string | null
          id: string
          created_at: string | null
          updated_at: string | null
          invoice_id: string | null
          staff_payroll_id: string | null
          party_type: 'client' | 'vendor' | 'staff' | 'other' | null
        }
        Insert: {
          contact_id?: string | null
          event_id?: string | null
          type: 'incoming' | 'outgoing'
          category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount: number
          payment_date: string
          payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number?: string | null
          notes?: string | null
          id?: string
          created_at?: string | null
          updated_at?: string | null
          invoice_id?: string | null
          staff_payroll_id?: string | null
          party_type?: 'client' | 'vendor' | 'staff' | 'other' | null
        }
        Update: {
          contact_id?: string | null
          event_id?: string | null
          type?: 'incoming' | 'outgoing'
          category?: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount?: number
          payment_date?: string
          payment_method?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number?: string | null
          notes?: string | null
          id?: string
          created_at?: string | null
          updated_at?: string | null
          invoice_id?: string | null
          staff_payroll_id?: string | null
          party_type?: 'client' | 'vendor' | 'staff' | 'other' | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_payroll"
            columns: ["staff_payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          id: string
          run_id: string
          staff_id: string
          components: Json
          earning_total: number | null
          deduction_total: number | null
          net_pay: number | null
          status: 'draft' | 'approved' | 'paid' | null
          payment_id: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          run_id: string
          staff_id: string
          components?: Json
          earning_total?: number | null
          deduction_total?: number | null
          net_pay?: number | null
          status?: 'draft' | 'approved' | 'paid' | null
          payment_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          run_id?: string
          staff_id?: string
          components?: Json
          earning_total?: number | null
          deduction_total?: number | null
          net_pay?: number | null
          status?: 'draft' | 'approved' | 'paid' | null
          payment_id?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          id: string
          period_from: string
          period_to: string
          payroll_month: string
          staff_filter: Json | null
          gross_total: number | null
          deduction_total: number | null
          net_total: number | null
          status: 'draft' | 'approved' | 'paid' | null
          approved_by: string | null
          paid_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          period_from: string
          period_to: string
          payroll_month: string
          staff_filter?: Json | null
          gross_total?: number | null
          deduction_total?: number | null
          net_total?: number | null
          status?: 'draft' | 'approved' | 'paid' | null
          approved_by?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          period_from?: string
          period_to?: string
          payroll_month?: string
          staff_filter?: Json | null
          gross_total?: number | null
          deduction_total?: number | null
          net_total?: number | null
          status?: 'draft' | 'approved' | 'paid' | null
          approved_by?: string | null
          paid_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rates: {
        Row: {
          inventory_item_id: string
          rental_type: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate: number
          security_deposit: number | null
          max_rental_days: number | null
          id: string
          min_rental_days: number | null
          applicable_days: number[] | null
          created_at: string | null
          updated_at: string | null
          weekend_rate: number | null
          slab: Json | null
        }
        Insert: {
          inventory_item_id: string
          rental_type: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate: number
          security_deposit?: number | null
          max_rental_days?: number | null
          id?: string
          min_rental_days?: number | null
          applicable_days?: number[] | null
          created_at?: string | null
          updated_at?: string | null
          weekend_rate?: number | null
          slab?: Json | null
        }
        Update: {
          inventory_item_id?: string
          rental_type?: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate?: number
          security_deposit?: number | null
          max_rental_days?: number | null
          id?: string
          min_rental_days?: number | null
          applicable_days?: number[] | null
          created_at?: string | null
          updated_at?: string | null
          weekend_rate?: number | null
          slab?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rates_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'super_admin' | 'admin' | 'accountant' | 'staff'
          display_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          role?: 'super_admin' | 'admin' | 'accountant' | 'staff'
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'accountant' | 'staff'
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          inventory_item_id: string | null
          item_name: string | null
          item_code: string | null
          qty: number
          days: number | null
          rate_from_system: number | null
          rate_applied: number
          override_reason: string | null
          discount: number | null
          line_total: number
          cost_line: number | null
          margin_line: number | null
          source: 'own' | 'rented_in' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          quote_id: string
          inventory_item_id?: string | null
          item_name?: string | null
          item_code?: string | null
          qty?: number
          days?: number | null
          rate_from_system?: number | null
          rate_applied?: number
          override_reason?: string | null
          discount?: number | null
          line_total?: number
          cost_line?: number | null
          margin_line?: number | null
          source?: 'own' | 'rented_in' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          quote_id?: string
          inventory_item_id?: string | null
          item_name?: string | null
          item_code?: string | null
          qty?: number
          days?: number | null
          rate_from_system?: number | null
          rate_applied?: number
          override_reason?: string | null
          discount?: number | null
          line_total?: number
          cost_line?: number | null
          margin_line?: number | null
          source?: 'own' | 'rented_in' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          id: string
          quote_no: string
          client_id: string
          event_type: string | null
          event_start_date: string | null
          event_end_date: string | null
          venue: string | null
          status: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'
          subtotal: number | null
          discount_amount: number | null
          tax_amount: number | null
          grand_total: number | null
          tax_mode: 'none' | 'gst' | null
          validity_days: number | null
          version: number | null
          parent_quote_id: string | null
          override_note: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          quote_no: string
          client_id: string
          event_type?: string | null
          event_start_date?: string | null
          event_end_date?: string | null
          venue?: string | null
          status?: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'
          subtotal?: number | null
          discount_amount?: number | null
          tax_amount?: number | null
          grand_total?: number | null
          tax_mode?: 'none' | 'gst' | null
          validity_days?: number | null
          version?: number | null
          parent_quote_id?: string | null
          override_note?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          quote_no?: string
          client_id?: string
          event_type?: string | null
          event_start_date?: string | null
          event_end_date?: string | null
          venue?: string | null
          status?: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'
          subtotal?: number | null
          discount_amount?: number | null
          tax_amount?: number | null
          grand_total?: number | null
          tax_mode?: 'none' | 'gst' | null
          validity_days?: number | null
          version?: number | null
          parent_quote_id?: string | null
          override_note?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contract_items: {
        Row: {
          id: string
          contract_id: string
          inventory_item_id: string | null
          item_name: string | null
          qty: number
          unit_rate: number | null
          days: number
          line_total: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contract_id: string
          inventory_item_id?: string | null
          item_name?: string | null
          qty?: number
          unit_rate?: number | null
          days?: number
          line_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contract_id?: string
          inventory_item_id?: string | null
          item_name?: string | null
          qty?: number
          unit_rate?: number | null
          days?: number
          line_total?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_contract_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "rental_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contract_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_contracts: {
        Row: {
          id: string
          contract_no: string
          direction: 'in' | 'out'
          party_id: string
          event_id: string | null
          contract_date: string
          start_date: string
          end_date: string
          rate_type: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed' | null
          rate: number | null
          total_amount: number | null
          security_deposit: number | null
          transport_cost: number | null
          terms: string | null
          status: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled' | null
          received_at: string | null
          returned_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contract_no: string
          direction: 'in' | 'out'
          party_id: string
          event_id?: string | null
          contract_date?: string
          start_date: string
          end_date: string
          rate_type?: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed' | null
          rate?: number | null
          total_amount?: number | null
          security_deposit?: number | null
          transport_cost?: number | null
          terms?: string | null
          status?: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled' | null
          received_at?: string | null
          returned_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contract_no?: string
          direction?: 'in' | 'out'
          party_id?: string
          event_id?: string | null
          contract_date?: string
          start_date?: string
          end_date?: string
          rate_type?: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed' | null
          rate?: number | null
          total_amount?: number | null
          security_deposit?: number | null
          transport_cost?: number | null
          terms?: string | null
          status?: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled' | null
          received_at?: string | null
          returned_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      special_rates: {
        Row: {
          id: string
          scope: string | null
          item_id: string | null
          category_id: string | null
          name: string
          rate_type: 'multiplier' | 'fixed' | null
          rate_value: number
          start_date: string
          end_date: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          scope?: string | null
          item_id?: string | null
          category_id?: string | null
          name: string
          rate_type?: 'multiplier' | 'fixed' | null
          rate_value?: number
          start_date: string
          end_date: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          scope?: string | null
          item_id?: string | null
          category_id?: string | null
          name?: string
          rate_type?: 'multiplier' | 'fixed' | null
          rate_value?: number
          start_date?: string
          end_date?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "special_rates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_rates_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_advances: {
        Row: {
          id: string
          staff_id: string
          amount: number
          reason: string | null
          date: string
          recovered_amount: number | null
          recovery_schedule: Json | null
          status: 'active' | 'fully_recovered' | 'cancelled' | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          amount?: number
          reason?: string | null
          date?: string
          recovered_amount?: number | null
          recovery_schedule?: Json | null
          status?: 'active' | 'fully_recovered' | 'cancelled' | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          amount?: number
          reason?: string | null
          date?: string
          recovered_amount?: number | null
          recovery_schedule?: Json | null
          status?: 'active' | 'fully_recovered' | 'cancelled' | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_advances_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          id: string
          contact_id: string | null
          designation: string | null
          employment_type: 'permanent' | 'contract' | 'daily' | null
          base_salary: number | null
          daily_wage: number | null
          bank_account: string | null
          ifsc_code: string | null
          pan: string | null
          aadhaar: string | null
          status: 'active' | 'inactive' | 'terminated' | null
          joined_at: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          contact_id?: string | null
          designation?: string | null
          employment_type?: 'permanent' | 'contract' | 'daily' | null
          base_salary?: number | null
          daily_wage?: number | null
          bank_account?: string | null
          ifsc_code?: string | null
          pan?: string | null
          aadhaar?: string | null
          status?: 'active' | 'inactive' | 'terminated' | null
          joined_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string | null
          designation?: string | null
          employment_type?: 'permanent' | 'contract' | 'daily' | null
          base_salary?: number | null
          daily_wage?: number | null
          bank_account?: string | null
          ifsc_code?: string | null
          pan?: string | null
          aadhaar?: string | null
          status?: 'active' | 'inactive' | 'terminated' | null
          joined_at?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          movement: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'
          quantity: number
          running_balance: number
          reference_type: string | null
          reference_id: string | null
          party_id: string | null
          notes: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          item_id: string
          movement: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'
          quantity: number
          running_balance: number
          reference_type?: string | null
          reference_id?: string | null
          party_id?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          movement?: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'
          quantity?: number
          running_balance?: number
          reference_type?: string | null
          reference_id?: string | null
          party_id?: string | null
          notes?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          proprietor_name: string | null
          contact_number: string | null
          email: string | null
          office_address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          gst_number: string | null
          logo_url: string | null
          banner_url: string | null
          website_url: string | null
          facebook_url: string | null
          instagram_url: string | null
          twitter_url: string | null
          favicon_url: string | null
          id: string
          system_name: string
          system_short_name: string
          owner_name: string
          currency_symbol: string
          date_format: string
          time_format: string
          theme_color: string | null
          accent_color: string | null
          created_at: string | null
          updated_at: string | null
          default_tax_mode: 'none' | 'gst' | null
          state_code: string | null
          invoice_prefix: string | null
          quote_prefix: string | null
          currency: string | null
        }
        Insert: {
          proprietor_name?: string | null
          contact_number?: string | null
          email?: string | null
          office_address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          gst_number?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          favicon_url?: string | null
          id?: string
          system_name?: string
          system_short_name?: string
          owner_name?: string
          currency_symbol?: string
          date_format?: string
          time_format?: string
          theme_color?: string | null
          accent_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          default_tax_mode?: 'none' | 'gst' | null
          state_code?: string | null
          invoice_prefix?: string | null
          quote_prefix?: string | null
          currency?: string | null
        }
        Update: {
          proprietor_name?: string | null
          contact_number?: string | null
          email?: string | null
          office_address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          gst_number?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website_url?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          favicon_url?: string | null
          id?: string
          system_name?: string
          system_short_name?: string
          owner_name?: string
          currency_symbol?: string
          date_format?: string
          time_format?: string
          theme_color?: string | null
          accent_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          default_tax_mode?: 'none' | 'gst' | null
          state_code?: string | null
          invoice_prefix?: string | null
          quote_prefix?: string | null
          currency?: string | null
        }
        Relationships: []
      }
      worker_assignments: {
        Row: {
          worker_id: string
          event_id: string
          role: string
          wage_per_day: number
          total_days: number
          total_wages: number
          notes: string | null
          id: string
          status: 'assigned' | 'working' | 'completed' | 'cancelled'
          created_at: string | null
          updated_at: string | null
          wage_basis: 'daily_wage' | 'salary' | 'fixed' | null
          ot_hours: number | null
          ot_rate: number | null
        }
        Insert: {
          worker_id: string
          event_id: string
          role: string
          wage_per_day: number
          total_days: number
          total_wages: number
          notes?: string | null
          id?: string
          status?: 'assigned' | 'working' | 'completed' | 'cancelled'
          created_at?: string | null
          updated_at?: string | null
          wage_basis?: 'daily_wage' | 'salary' | 'fixed' | null
          ot_hours?: number | null
          ot_rate?: number | null
        }
        Update: {
          worker_id?: string
          event_id?: string
          role?: string
          wage_per_day?: number
          total_days?: number
          total_wages?: number
          notes?: string | null
          id?: string
          status?: 'assigned' | 'working' | 'completed' | 'cancelled'
          created_at?: string | null
          updated_at?: string | null
          wage_basis?: 'daily_wage' | 'salary' | 'fixed' | null
          ot_hours?: number | null
          ot_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_assignments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      can_assign_role: {
        Args: {
          _unknown: never
        }
        Returns: boolean
      }
      can_change_profile_privileged: {
        Args: {
          _unknown: never
        }
        Returns: boolean
      }
      current_user_role: {
        Args: {
          _unknown: never
        }
        Returns: string
      }
      guard_profile_privileged_fields: {
        Args: {
          _unknown: never
        }
        Returns: unknown
      }
      handle_new_user: {
        Args: {
          _unknown: never
        }
        Returns: unknown
      }
      is_trusted_profile_writer: {
        Args: {
          _unknown: never
        }
        Returns: boolean
      }
      role_rank: {
        Args: {
          _unknown: never
        }
        Returns: unknown
      }
      update_updated_at_column: {
        Args: {
          _unknown: never
        }
        Returns: unknown
      }
      uuid_generate_v4: {
        Args: {
          _unknown: never
        }
        Returns: string
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
