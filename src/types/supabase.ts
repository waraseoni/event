export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'other'
          phone: string | null
          email: string | null
          address: string | null
          company_name: string | null
          gst_number: string | null
          segment: string | null
          credit_days: number | null
          contact_person: string | null
          follow_up_date: string | null
          source: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'vendor' | 'renter' | 'customer' | 'other'
          phone?: string | null
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          segment?: string | null
          credit_days?: number | null
          contact_person?: string | null
          follow_up_date?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'vendor' | 'renter' | 'customer' | 'other'
          phone?: string | null
          email?: string | null
          address?: string | null
          company_name?: string | null
          gst_number?: string | null
          segment?: string | null
          credit_days?: number | null
          contact_person?: string | null
          follow_up_date?: string | null
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'owner' | 'manager' | 'accountant' | 'staff'
          display_name: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          role?: 'owner' | 'manager' | 'accountant' | 'staff'
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          role?: 'owner' | 'manager' | 'accountant' | 'staff'
          display_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      item_categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          icon: string | null
          sort_order: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: { id?: string; name: string; parent_id?: string | null; icon?: string | null; sort_order?: number | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; parent_id?: string | null; icon?: string | null; sort_order?: number | null; is_active?: boolean; created_at?: string; updated_at?: string }
      }
      item_locations: {
        Row: { id: string; name: string; address: string | null; city: string | null; state: string | null; pincode: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category_id: string | null
          description: string | null
          serial_number: string | null
          unique_code: string
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
          total_quantity: number
          unit: string | null
          location_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          status: 'available' | 'rented' | 'maintenance' | 'retired'
          reorder_level: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: { id?: string; name: string; category_id?: string | null; description?: string | null; serial_number?: string | null; unique_code?: string; company?: string | null; model?: string | null; scope?: string | null; item_type?: 'owned' | 'leased'; target_event_types?: string[] | null; estimated_rent_price?: number | null; min_price?: number | null; security_deposit?: number | null; hsn_code?: string | null; images?: string[] | null; total_quantity?: number; unit?: string | null; location_id?: string | null; purchase_date?: string | null; purchase_price?: number | null; condition?: 'excellent' | 'good' | 'fair' | 'poor'; status?: 'available' | 'rented' | 'maintenance' | 'retired'; reorder_level?: number | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; category_id?: string | null; description?: string | null; serial_number?: string | null; unique_code?: string; company?: string | null; model?: string | null; scope?: string | null; item_type?: 'owned' | 'leased'; target_event_types?: string[] | null; estimated_rent_price?: number | null; min_price?: number | null; security_deposit?: number | null; hsn_code?: string | null; images?: string[] | null; total_quantity?: number; unit?: string | null; location_id?: string | null; purchase_date?: string | null; purchase_price?: number | null; condition?: 'excellent' | 'good' | 'fair' | 'poor'; status?: 'available' | 'rented' | 'maintenance' | 'retired'; reorder_level?: number | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      item_serials: {
        Row: { id: string; item_id: string; serial_code: string; qr_code: string | null; condition: 'excellent' | 'good' | 'fair' | 'poor' | null; status: 'available' | 'rented' | 'maintenance' | 'retired' | null; assigned_to: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; item_id: string; serial_code: string; qr_code?: string | null; condition?: 'excellent' | 'good' | 'fair' | 'poor'; status?: 'available' | 'rented' | 'maintenance' | 'retired'; assigned_to?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; item_id?: string; serial_code?: string; qr_code?: string | null; condition?: 'excellent' | 'good' | 'fair' | 'poor'; status?: 'available' | 'rented' | 'maintenance' | 'retired'; assigned_to?: string | null; created_at?: string; updated_at?: string }
      }
      maintenance_records: {
        Row: { id: string; item_id: string; maintenance_type: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other' | null; description: string | null; cost: number | null; vendor_id: string | null; started_at: string; completed_at: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; item_id: string; maintenance_type?: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other'; description?: string | null; cost?: number | null; vendor_id?: string | null; started_at?: string; completed_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; item_id?: string; maintenance_type?: 'repair' | 'service' | 'calibration' | 'upgrade' | 'other'; description?: string | null; cost?: number | null; vendor_id?: string | null; started_at?: string; completed_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      pricing_rates: {
        Row: { id: string; inventory_item_id: string; rental_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_event'; rate: number; weekend_rate: number | null; applicable_days: number[] | null; security_deposit: number | null; min_days: number | null; max_days: number | null; slab: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; inventory_item_id: string; rental_type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_event'; rate: number; weekend_rate?: number | null; applicable_days?: number[] | null; security_deposit?: number | null; min_days?: number | null; max_days?: number | null; slab?: Json | null; created_at?: string; updated_at?: string }
        Update: { id?: string; inventory_item_id?: string; rental_type?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'per_event'; rate?: number; weekend_rate?: number | null; applicable_days?: number[] | null; security_deposit?: number | null; min_days?: number | null; max_days?: number | null; slab?: Json | null; created_at?: string; updated_at?: string }
      }
      special_rates: {
        Row: { id: string; scope: string | null; item_id: string | null; category_id: string | null; name: string; rate_type: 'multiplier' | 'fixed' | null; rate_value: number; start_date: string; end_date: string; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; scope?: string | null; item_id?: string | null; category_id?: string | null; name: string; rate_type?: 'multiplier' | 'fixed'; rate_value?: number; start_date?: string; end_date?: string; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; scope?: string | null; item_id?: string | null; category_id?: string | null; name?: string; rate_type?: 'multiplier' | 'fixed'; rate_value?: number; start_date?: string; end_date?: string; notes?: string | null; created_at?: string; updated_at?: string }
      }
      quotes: {
        Row: { id: string; quote_no: string; client_id: string; event_type: string | null; event_start_date: string | null; event_end_date: string | null; venue: string | null; status: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'; subtotal: number | null; discount_amount: number | null; tax_amount: number | null; grand_total: number | null; tax_mode: 'none' | 'gst' | null; validity_days: number | null; version: number | null; parent_quote_id: string | null; override_note: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; quote_no?: string; client_id: string; event_type?: string | null; event_start_date?: string | null; event_end_date?: string | null; venue?: string | null; status?: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'; subtotal?: number | null; discount_amount?: number | null; tax_amount?: number | null; grand_total?: number | null; tax_mode?: 'none' | 'gst'; validity_days?: number | null; version?: number | null; parent_quote_id?: string | null; override_note?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; quote_no?: string; client_id?: string; event_type?: string | null; event_start_date?: string | null; event_end_date?: string | null; venue?: string | null; status?: 'draft' | 'sent' | 'negotiating' | 'approved' | 'rejected' | 'converted'; subtotal?: number | null; discount_amount?: number | null; tax_amount?: number | null; grand_total?: number | null; tax_mode?: 'none' | 'gst'; validity_days?: number | null; version?: number | null; parent_quote_id?: string | null; override_note?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      quote_items: {
        Row: { id: string; quote_id: string; inventory_item_id: string | null; item_name: string | null; item_code: string | null; qty: number | null; days: number | null; rate_from_system: number | null; rate_applied: number | null; override_reason: string | null; discount: number | null; line_total: number | null; cost_line: number | null; margin_line: number | null; source: 'own' | 'rented_in' | null; created_at: string; updated_at: string }
        Insert: { id?: string; quote_id: string; inventory_item_id?: string | null; item_name?: string | null; item_code?: string | null; qty?: number | null; days?: number | null; rate_from_system?: number | null; rate_applied?: number | null; override_reason?: string | null; discount?: number | null; line_total?: number | null; cost_line?: number | null; margin_line?: number | null; source?: 'own' | 'rented_in'; created_at?: string; updated_at?: string }
        Update: { id?: string; quote_id?: string; inventory_item_id?: string | null; item_name?: string | null; item_code?: string | null; qty?: number | null; days?: number | null; rate_from_system?: number | null; rate_applied?: number | null; override_reason?: string | null; discount?: number | null; line_total?: number | null; cost_line?: number | null; margin_line?: number | null; source?: 'own' | 'rented_in'; created_at?: string; updated_at?: string }
      }
      events: {
        Row: { id: string; event_no: string; quote_id: string | null; client_id: string; event_type: string; name: string; start_datetime: string; end_datetime: string | null; venue: string | null; venue_address: string | null; status: 'inquiry' | 'quoted' | 'confirmed' | 'setup' | 'live' | 'teardown' | 'completed' | 'cancelled'; client_advance: number | null; total_amount: number | null; total_expenses: number | null; profit_loss: number | null; tax_mode: 'none' | 'gst' | null; subtotal: number | null; tax_amount: number | null; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_no?: string; quote_id?: string | null; client_id: string; event_type: string; name: string; start_datetime: string; end_datetime?: string | null; venue?: string | null; venue_address?: string | null; status?: 'inquiry' | 'quoted' | 'confirmed' | 'setup' | 'live' | 'teardown' | 'completed' | 'cancelled'; client_advance?: number | null; total_amount?: number | null; total_expenses?: number | null; profit_loss?: number | null; tax_mode?: 'none' | 'gst'; subtotal?: number | null; tax_amount?: number | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_no?: string; quote_id?: string | null; client_id?: string; event_type?: string; name?: string; start_datetime?: string; end_datetime?: string | null; venue?: string | null; venue_address?: string | null; status?: 'inquiry' | 'quoted' | 'confirmed' | 'setup' | 'live' | 'teardown' | 'completed' | 'cancelled'; client_advance?: number | null; total_amount?: number | null; total_expenses?: number | null; profit_loss?: number | null; tax_mode?: 'none' | 'gst'; subtotal?: number | null; tax_amount?: number | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string }
      }
      event_items: {
        Row: { id: string; event_id: string; inventory_item_id: string; quote_item_id: string | null; source: 'own' | 'rented_in' | null; qty: number | null; days: number | null; unit_rate: number | null; line_total: number | null; cost_line: number | null; pickup_datetime: string | null; return_datetime: string | null; picked_qty: number | null; returned_qty: number | null; damaged_qty: number | null; status: 'reserved' | 'picked_up' | 'returned' | 'damaged' | 'cancelled' | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_id: string; inventory_item_id: string; quote_item_id?: string | null; source?: 'own' | 'rented_in'; qty?: number | null; days?: number | null; unit_rate?: number | null; line_total?: number | null; cost_line?: number | null; pickup_datetime?: string | null; return_datetime?: string | null; picked_qty?: number | null; returned_qty?: number | null; damaged_qty?: number | null; status?: 'reserved' | 'picked_up' | 'returned' | 'damaged' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_id?: string; inventory_item_id?: string; quote_item_id?: string | null; source?: 'own' | 'rented_in'; qty?: number | null; days?: number | null; unit_rate?: number | null; line_total?: number | null; cost_line?: number | null; pickup_datetime?: string | null; return_datetime?: string | null; picked_qty?: number | null; returned_qty?: number | null; damaged_qty?: number | null; status?: 'reserved' | 'picked_up' | 'returned' | 'damaged' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
      }
      event_staff: {
        Row: { id: string; event_id: string; staff_id: string; role: string | null; wage_basis: 'daily_wage' | 'salary' | 'fixed' | null; wage_per_day: number | null; days: number | null; ot_hours: number | null; ot_rate: number | null; total_wages: number | null; status: 'assigned' | 'working' | 'completed' | 'cancelled' | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_id: string; staff_id: string; role?: string | null; wage_basis?: 'daily_wage' | 'salary' | 'fixed'; wage_per_day?: number | null; days?: number | null; ot_hours?: number | null; ot_rate?: number | null; total_wages?: number | null; status?: 'assigned' | 'working' | 'completed' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_id?: string; staff_id?: string; role?: string | null; wage_basis?: 'daily_wage' | 'salary' | 'fixed'; wage_per_day?: number | null; days?: number | null; ot_hours?: number | null; ot_rate?: number | null; total_wages?: number | null; status?: 'assigned' | 'working' | 'completed' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
      }
      event_tasks: {
        Row: { id: string; event_id: string; title: string | null; description: string | null; assignee: string | null; status: 'todo' | 'doing' | 'done' | null; priority: 'low' | 'medium' | 'high' | 'urgent' | null; due_date: string | null; completed_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_id: string; title?: string | null; description?: string | null; assignee?: string | null; status?: 'todo' | 'doing' | 'done'; priority?: 'low' | 'medium' | 'high' | 'urgent'; due_date?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_id?: string; title?: string | null; description?: string | null; assignee?: string | null; status?: 'todo' | 'doing' | 'done'; priority?: 'low' | 'medium' | 'high' | 'urgent'; due_date?: string | null; completed_at?: string | null; created_at?: string; updated_at?: string }
      }
      event_expenses: {
        Row: { id: string; event_id: string; category: string | null; description: string | null; amount: number | null; paid_to: string | null; payment_ref: string | null; is_paid: boolean | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_id: string; category?: string | null; description?: string | null; amount?: number | null; paid_to?: string | null; payment_ref?: string | null; is_paid?: boolean | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_id?: string; category?: string | null; description?: string | null; amount?: number | null; paid_to?: string | null; payment_ref?: string | null; is_paid?: boolean | null; created_at?: string; updated_at?: string }
      }
      rental_contracts: {
        Row: { id: string; contract_no: string; direction: 'in' | 'out'; party_id: string; event_id: string | null; contract_date: string | null; start_date: string; end_date: string; rate_type: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed' | null; rate: number | null; total_amount: number | null; security_deposit: number | null; transport_cost: number | null; terms: string | null; status: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled' | null; received_at: string | null; returned_at: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; contract_no?: string; direction: 'in' | 'out'; party_id: string; event_id?: string | null; contract_date?: string | null; start_date?: string; end_date?: string; rate_type?: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed'; rate?: number | null; total_amount?: number | null; security_deposit?: number | null; transport_cost?: number | null; terms?: string | null; status?: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled'; received_at?: string | null; returned_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; contract_no?: string; direction?: 'in' | 'out'; party_id?: string; event_id?: string | null; contract_date?: string | null; start_date?: string; end_date?: string; rate_type?: 'daily' | 'weekly' | 'monthly' | 'per_event' | 'fixed'; rate?: number | null; total_amount?: number | null; security_deposit?: number | null; transport_cost?: number | null; terms?: string | null; status?: 'requested' | 'approved' | 'dispatched' | 'received' | 'returned' | 'closed' | 'cancelled'; received_at?: string | null; returned_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      rental_contract_items: {
        Row: { id: string; contract_id: string; inventory_item_id: string | null; item_name: string | null; qty: number | null; unit_rate: number | null; days: number | null; line_total: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; contract_id: string; inventory_item_id?: string | null; item_name?: string | null; qty?: number | null; unit_rate?: number | null; days?: number | null; line_total?: number | null; created_at?: string; updated_at?: string }
        Update: { id?: string; contract_id?: string; inventory_item_id?: string | null; item_name?: string | null; qty?: number | null; unit_rate?: number | null; days?: number | null; line_total?: number | null; created_at?: string; updated_at?: string }
      }
      staff_members: {
        Row: { id: string; contact_id: string | null; designation: string | null; employment_type: 'permanent' | 'contract' | 'daily' | null; base_salary: number | null; daily_wage: number | null; bank_account: string | null; ifsc_code: string | null; pan: string | null; aadhaar: string | null; status: 'active' | 'inactive' | 'terminated' | null; joined_at: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; contact_id?: string | null; designation?: string | null; employment_type?: 'permanent' | 'contract' | 'daily'; base_salary?: number | null; daily_wage?: number | null; bank_account?: string | null; ifsc_code?: string | null; pan?: string | null; aadhaar?: string | null; status?: 'active' | 'inactive' | 'terminated'; joined_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; contact_id?: string | null; designation?: string | null; employment_type?: 'permanent' | 'contract' | 'daily'; base_salary?: number | null; daily_wage?: number | null; bank_account?: string | null; ifsc_code?: string | null; pan?: string | null; aadhaar?: string | null; status?: 'active' | 'inactive' | 'terminated'; joined_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      attendance: {
        Row: { id: string; staff_id: string; date: string; status: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff' | null; hours: number | null; event_id: string | null; notes: string | null; marked_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; staff_id: string; date: string; status?: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff'; hours?: number | null; event_id?: string | null; notes?: string | null; marked_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; staff_id?: string; date?: string; status?: 'present' | 'absent' | 'half' | 'leave' | 'holiday' | 'weekoff'; hours?: number | null; event_id?: string | null; notes?: string | null; marked_by?: string | null; created_at?: string; updated_at?: string }
      }
      staff_advances: {
        Row: { id: string; staff_id: string; amount: number; reason: string | null; date: string | null; recovered_amount: number | null; recovery_schedule: Json | null; status: 'active' | 'fully_recovered' | 'cancelled' | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; staff_id: string; amount?: number; reason?: string | null; date?: string | null; recovered_amount?: number | null; recovery_schedule?: Json | null; status?: 'active' | 'fully_recovered' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; staff_id?: string; amount?: number; reason?: string | null; date?: string | null; recovered_amount?: number | null; recovery_schedule?: Json | null; status?: 'active' | 'fully_recovered' | 'cancelled'; notes?: string | null; created_at?: string; updated_at?: string }
      }
      commission_rules: {
        Row: { id: string; staff_id: string; basis: 'event_revenue' | 'event_profit' | 'payment_collected'; percent: number | null; slabs: Json | null; is_active: boolean | null; created_at: string; updated_at: string }
        Insert: { id?: string; staff_id: string; basis: 'event_revenue' | 'event_profit' | 'payment_collected'; percent?: number | null; slabs?: Json | null; is_active?: boolean | null; created_at?: string; updated_at?: string }
        Update: { id?: string; staff_id?: string; basis?: 'event_revenue' | 'event_profit' | 'payment_collected'; percent?: number | null; slabs?: Json | null; is_active?: boolean | null; created_at?: string; updated_at?: string }
      }
      bonuses: {
        Row: { id: string; staff_id: string; type: 'performance' | 'festival' | 'referral' | 'custom'; amount: number; formula: string | null; event_id: string | null; date: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; staff_id: string; type?: 'performance' | 'festival' | 'referral' | 'custom'; amount?: number; formula?: string | null; event_id?: string | null; date?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; staff_id?: string; type?: 'performance' | 'festival' | 'referral' | 'custom'; amount?: number; formula?: string | null; event_id?: string | null; date?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      payroll_runs: {
        Row: { id: string; period_from: string; period_to: string; payroll_month: string; staff_filter: Json | null; gross_total: number | null; deduction_total: number | null; net_total: number | null; status: 'draft' | 'approved' | 'paid' | null; approved_by: string | null; paid_at: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; period_from?: string; period_to?: string; payroll_month?: string; staff_filter?: Json | null; gross_total?: number | null; deduction_total?: number | null; net_total?: number | null; status?: 'draft' | 'approved' | 'paid'; approved_by?: string | null; paid_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; period_from?: string; period_to?: string; payroll_month?: string; staff_filter?: Json | null; gross_total?: number | null; deduction_total?: number | null; net_total?: number | null; status?: 'draft' | 'approved' | 'paid'; approved_by?: string | null; paid_at?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      payroll_entries: {
        Row: { id: string; run_id: string; staff_id: string; components: Json; earning_total: number | null; deduction_total: number | null; net_pay: number | null; status: 'draft' | 'approved' | 'paid' | null; payment_id: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; run_id: string; staff_id: string; components?: Json; earning_total?: number | null; deduction_total?: number | null; net_pay?: number | null; status?: 'draft' | 'approved' | 'paid'; payment_id?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; run_id?: string; staff_id?: string; components?: Json; earning_total?: number | null; deduction_total?: number | null; net_pay?: number | null; status?: 'draft' | 'approved' | 'paid'; payment_id?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      invoices: {
        Row: { id: string; invoice_no: string; event_id: string | null; client_id: string; quote_id: string | null; issue_date: string | null; due_date: string | null; subtotal: number | null; discount_amount: number | null; cgst: number | null; sgst: number | null; igst: number | null; round_off: number | null; tds: number | null; grand_total: number | null; amount_paid: number | null; amount_due: number | null; tax_mode: 'none' | 'gst' | null; status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | null; pdf_url: string | null; notes: string | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; invoice_no?: string; event_id?: string | null; client_id: string; quote_id?: string | null; issue_date?: string | null; due_date?: string | null; subtotal?: number | null; discount_amount?: number | null; cgst?: number | null; sgst?: number | null; igst?: number | null; round_off?: number | null; tds?: number | null; grand_total?: number | null; amount_paid?: number | null; amount_due?: number | null; tax_mode?: 'none' | 'gst'; status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'; pdf_url?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; invoice_no?: string; event_id?: string | null; client_id?: string; quote_id?: string | null; issue_date?: string | null; due_date?: string | null; subtotal?: number | null; discount_amount?: number | null; cgst?: number | null; sgst?: number | null; igst?: number | null; round_off?: number | null; tds?: number | null; grand_total?: number | null; amount_paid?: number | null; amount_due?: number | null; tax_mode?: 'none' | 'gst'; status?: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'; pdf_url?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; updated_at?: string }
      }
      invoice_items: {
        Row: { id: string; invoice_id: string; description: string | null; hsn: string | null; qty: number | null; rate: number | null; amount: number | null; created_at: string; updated_at: string }
        Insert: { id?: string; invoice_id: string; description?: string | null; hsn?: string | null; qty?: number | null; rate?: number | null; amount?: number | null; created_at?: string; updated_at?: string }
        Update: { id?: string; invoice_id?: string; description?: string | null; hsn?: string | null; qty?: number | null; rate?: number | null; amount?: number | null; created_at?: string; updated_at?: string }
      }
      expenses: {
        Row: { id: string; category: string | null; description: string | null; amount: number | null; paid_via: string | null; paid_to: string | null; reference: string | null; date: string | null; is_event: boolean | null; event_id: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; category?: string | null; description?: string | null; amount?: number | null; paid_via?: string | null; paid_to?: string | null; reference?: string | null; date?: string | null; is_event?: boolean | null; event_id?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; category?: string | null; description?: string | null; amount?: number | null; paid_via?: string | null; paid_to?: string | null; reference?: string | null; date?: string | null; is_event?: boolean | null; event_id?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
      }
      stock_movements: {
        Row: { id: string; item_id: string; movement: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'; quantity: number | null; running_balance: number | null; reference_type: string | null; reference_id: string | null; party_id: string | null; notes: string | null; created_at: string | null; created_by: string | null }
        Insert: { id?: string; item_id: string; movement?: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'; quantity?: number | null; running_balance?: number | null; reference_type?: string | null; reference_id?: string | null; party_id?: string | null; notes?: string | null; created_at?: string | null; created_by?: string | null }
        Update: { id?: string; item_id?: string; movement?: 'purchase' | 'rent_in' | 'rent_out' | 'event_pickup' | 'event_return' | 'transfer' | 'adjust' | 'damage' | 'retire' | 'maintenance'; quantity?: number | null; running_balance?: number | null; reference_type?: string | null; reference_id?: string | null; party_id?: string | null; notes?: string | null; created_at?: string | null; created_by?: string | null }
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; body: string | null; type: 'info' | 'warning' | 'success' | 'alert' | null; entity_type: string | null; entity_id: string | null; is_read: boolean | null; created_at: string | null }
        Insert: { id?: string; user_id: string; title: string; body?: string | null; type?: 'info' | 'warning' | 'success' | 'alert'; entity_type?: string | null; entity_id?: string | null; is_read?: boolean | null; created_at?: string | null }
        Update: { id?: string; user_id?: string; title?: string; body?: string | null; type?: 'info' | 'warning' | 'success' | 'alert'; entity_type?: string | null; entity_id?: string | null; is_read?: boolean | null; created_at?: string | null }
      }
      audit_log: {
        Row: { id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; old_values: Json | null; new_values: Json | null; ip: string | null; created_at: string | null }
        Insert: { id?: string; user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; old_values?: Json | null; new_values?: Json | null; ip?: string | null; created_at?: string | null }
        Update: { id?: string; user_id?: string | null; action?: string; entity_type?: string; entity_id?: string | null; old_values?: Json | null; new_values?: Json | null; ip?: string | null; created_at?: string | null }
      }
      system_settings: {
        Row: { id: string; system_name: string; system_short_name: string; owner_name: string; proprietor_name: string | null; contact_number: string | null; email: string | null; office_address: string | null; city: string | null; state: string | null; pincode: string | null; gst_number: string | null; logo_url: string | null; banner_url: string | null; website_url: string | null; facebook_url: string | null; instagram_url: string | null; twitter_url: string | null; favicon_url: string | null; currency_symbol: string | null; currency: string | null; default_tax_mode: string | null; state_code: string | null; invoice_prefix: string | null; quote_prefix: string | null; date_format: string | null; time_format: string | null; theme_color: string | null; accent_color: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; system_name?: string; system_short_name?: string; owner_name?: string; proprietor_name?: string | null; contact_number?: string | null; email?: string | null; office_address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; gst_number?: string | null; logo_url?: string | null; banner_url?: string | null; website_url?: string | null; facebook_url?: string | null; instagram_url?: string | null; twitter_url?: string | null; favicon_url?: string | null; currency_symbol?: string | null; currency?: string | null; default_tax_mode?: string | null; state_code?: string | null; invoice_prefix?: string | null; quote_prefix?: string | null; date_format?: string | null; time_format?: string | null; theme_color?: string | null; accent_color?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; system_name?: string; system_short_name?: string; owner_name?: string; proprietor_name?: string | null; contact_number?: string | null; email?: string | null; office_address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; gst_number?: string | null; logo_url?: string | null; banner_url?: string | null; website_url?: string | null; facebook_url?: string | null; instagram_url?: string | null; twitter_url?: string | null; favicon_url?: string | null; currency_symbol?: string | null; currency?: string | null; default_tax_mode?: string | null; state_code?: string | null; invoice_prefix?: string | null; quote_prefix?: string | null; date_format?: string | null; time_format?: string | null; theme_color?: string | null; accent_color?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      payments: {
        Row: { id: string; contact_id: string | null; event_id: string | null; invoice_id: string | null; staff_payroll_id: string | null; party_type: string | null; type: 'incoming' | 'outgoing' | null; category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other' | null; amount: number | null; payment_date: string | null; payment_method: string | null; reference_number: string | null; notes: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; contact_id?: string | null; event_id?: string | null; invoice_id?: string | null; staff_payroll_id?: string | null; party_type?: string | null; type?: 'incoming' | 'outgoing'; category?: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'; amount?: number | null; payment_date?: string | null; payment_method?: string | null; reference_number?: string | null; notes?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; contact_id?: string | null; event_id?: string | null; invoice_id?: string | null; staff_payroll_id?: string | null; party_type?: string | null; type?: 'incoming' | 'outgoing'; category?: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'; amount?: number | null; payment_date?: string | null; payment_method?: string | null; reference_number?: string | null; notes?: string | null; created_at?: string | null; updated_at?: string | null }
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
