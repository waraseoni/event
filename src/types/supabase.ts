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
      contacts: {
        Row: {
          id: string
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'worker'
          phone: string
          email: string | null
          address: string | null
          company_name: string | null
          gst_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'worker'
          phone: string
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'vendor' | 'renter' | 'customer' | 'worker'
          phone?: string
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          serial_number: string | null
          unique_code: string
          total_quantity: number
          available_quantity: number
          unit: string
          purchase_date: string | null
          purchase_price: number | null
          condition: 'excellent' | 'good' | 'fair' | 'poor'
          status: 'available' | 'rented' | 'maintenance' | 'retired'
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          serial_number?: string | null
          unique_code: string
          total_quantity?: number
          available_quantity?: number
          unit: string
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor'
          status?: 'available' | 'rented' | 'maintenance' | 'retired'
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          serial_number?: string | null
          unique_code?: string
          total_quantity?: number
          available_quantity?: number
          unit?: string
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: 'excellent' | 'good' | 'fair' | 'poor'
          status?: 'available' | 'rented' | 'maintenance' | 'retired'
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pricing_rates: {
        Row: {
          id: string
          inventory_item_id: string
          rental_type: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate: number
          security_deposit: number | null
          min_rental_days: number | null
          max_rental_days: number | null
          applicable_days: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          rental_type: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate: number
          security_deposit?: number | null
          min_rental_days?: number | null
          max_rental_days?: number | null
          applicable_days?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          rental_type?: 'daily' | 'weekly' | 'monthly' | 'per_event'
          rate?: number
          security_deposit?: number | null
          min_rental_days?: number | null
          max_rental_days?: number | null
          applicable_days?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          name: string
          customer_id: string
          event_type: string
          event_date: string
          end_date: string | null
          venue_address: string | null
          status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount: number
          total_expenses: number
          profit_loss: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          customer_id: string
          event_type: string
          event_date: string
          end_date?: string | null
          venue_address?: string | null
          status?: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount?: number
          total_expenses?: number
          profit_loss?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          customer_id?: string
          event_type?: string
          event_date?: string
          end_date?: string | null
          venue_address?: string | null
          status?: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
          total_amount?: number
          total_expenses?: number
          profit_loss?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_items: {
        Row: {
          id: string
          event_id: string
          inventory_item_id: string
          quantity: number
          rental_days: number
          rental_start_date: string
          rental_end_date: string
          unit_rate: number
          total_amount: number
          status: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          inventory_item_id: string
          quantity: number
          rental_days: number
          rental_start_date: string
          rental_end_date: string
          unit_rate: number
          total_amount: number
          status?: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          inventory_item_id?: string
          quantity?: number
          rental_days?: number
          rental_start_date?: string
          rental_end_date?: string
          unit_rate?: number
          total_amount?: number
          status?: 'reserved' | 'picked_up' | 'returned' | 'damaged'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      external_rentals: {
        Row: {
          id: string
          vendor_id: string
          event_id: string | null
          item_name: string
          description: string | null
          quantity: number
          rental_start_date: string
          rental_end_date: string
          rental_days: number
          unit_rate: number
          total_amount: number
          security_deposit: number | null
          status: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          event_id?: string | null
          item_name: string
          description?: string | null
          quantity: number
          rental_start_date: string
          rental_end_date: string
          rental_days: number
          unit_rate: number
          total_amount: number
          security_deposit?: number | null
          status?: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          event_id?: string | null
          item_name?: string
          description?: string | null
          quantity?: number
          rental_start_date?: string
          rental_end_date?: string
          rental_days?: number
          unit_rate?: number
          total_amount?: number
          security_deposit?: number | null
          status?: 'booked' | 'picked_up' | 'returned' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      worker_assignments: {
        Row: {
          id: string
          worker_id: string
          event_id: string
          role: string
          wage_per_day: number
          total_days: number
          total_wages: number
          status: 'assigned' | 'working' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          event_id: string
          role: string
          wage_per_day: number
          total_days: number
          total_wages: number
          status?: 'assigned' | 'working' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          worker_id?: string
          event_id?: string
          role?: string
          wage_per_day?: number
          total_days?: number
          total_wages?: number
          status?: 'assigned' | 'working' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          contact_id: string | null
          event_id: string | null
          type: 'incoming' | 'outgoing'
          category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount: number
          payment_date: string
          payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          event_id?: string | null
          type: 'incoming' | 'outgoing'
          category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount: number
          payment_date: string
          payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          event_id?: string | null
          type?: 'incoming' | 'outgoing'
          category?: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
          amount?: number
          payment_date?: string
          payment_method?: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
          reference_number?: string | null
          notes?: string | null
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
      [_ in never]: never
    }
  }
}
