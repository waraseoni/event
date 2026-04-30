// Contact Types
export type ContactType = 'vendor' | 'renter' | 'customer' | 'worker'

export interface Contact {
  id: string
  name: string
  type: ContactType
  phone: string
  email?: string
  address?: string
  company_name?: string
  gst_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  category: string
  description?: string
  serial_number?: string
  unique_code: string
  total_quantity: number
  available_quantity: number
  unit: string
  purchase_date?: string
  purchase_price?: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  status: 'available' | 'rented' | 'maintenance' | 'retired'
  location?: string
  created_at: string
  updated_at: string
}

// Pricing Types
export interface PricingRate {
  id: string
  inventory_item_id: string
  inventory_item?: InventoryItem
  rental_type: 'daily' | 'weekly' | 'monthly' | 'per_event'
  rate: number
  security_deposit?: number
  min_rental_days?: number
  max_rental_days?: number
  applicable_days?: number[] // [0,1,2,3,4,5,6] for days of week
  special_rates?: SpecialRate[]
  created_at: string
  updated_at: string
}

export interface SpecialRate {
  id: string
  pricing_rate_id: string
  name: string
  rate: number
  start_date: string
  end_date: string
}

// Event Types
export interface Event {
  id: string
  name: string
  customer_id: string
  customer?: Contact
  event_type: string
  event_date: string
  end_date?: string
  venue_address?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  total_amount: number
  total_expenses: number
  profit_loss: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface EventItem {
  id: string
  event_id: string
  event?: Event
  inventory_item_id: string
  inventory_item?: InventoryItem
  quantity: number
  rental_days: number
  rental_start_date: string
  rental_end_date: string
  unit_rate: number
  total_amount: number
  status: 'reserved' | 'picked_up' | 'returned' | 'damaged'
  notes?: string
  created_at: string
  updated_at: string
}

// External Rental Types (when we rent from others)
export interface ExternalRental {
  id: string
  vendor_id: string
  vendor?: Contact
  event_id?: string
  event?: Event
  item_name: string
  description?: string
  quantity: number
  rental_start_date: string
  rental_end_date: string
  rental_days: number
  unit_rate: number
  total_amount: number
  security_deposit?: number
  status: 'booked' | 'picked_up' | 'returned' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

// Worker Assignment Types
export interface WorkerAssignment {
  id: string
  worker_id: string
  worker?: Contact
  event_id: string
  event?: Event
  role: string
  wage_per_day: number
  total_days: number
  total_wages: number
  status: 'assigned' | 'working' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

// Payment Types
export interface Payment {
  id: string
  contact_id?: string
  contact?: Contact
  event_id?: string
  event?: Event
  type: 'incoming' | 'outgoing'
  category: 'rental_income' | 'rental_expense' | 'wages' | 'advance' | 'refund' | 'other'
  amount: number
  payment_date: string
  payment_method: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
  reference_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Dashboard Types
export interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  activeRentals: number
  availableItems: number
  monthlyRevenue: number
  monthlyExpenses: number
  netProfit: number
}

export interface BookingCapacity {
  inventory_item_id: string
  inventory_item_name: string
  total_quantity: number
  currently_booked: number
  available_for_booking: number
  upcoming_events_count: number
  max_possible_events: number
}

// Filter Types
export interface DateRange {
  from?: Date
  to?: Date
}

export interface ContactFilter {
  type?: ContactType
  search?: string
}

export interface InventoryFilter {
  category?: string
  status?: string
  search?: string
}

export interface EventFilter {
  status?: string
  dateRange?: DateRange
  customerId?: string
}
