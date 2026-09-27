// ---------------------------------------------------------------------------
// Table-backed types are DERIVED from src/types/supabase.ts, which is generated
// from supabase/schema.sql (see supabase/validation/gen-types.js).
//
// They used to be hand-written here, and drifted. That drift was invisible
// because the browser client was created without a Database generic, so nothing
// ever type-checked a query. Two concrete casualties: InventoryItem.item_type
// was 'owned'|'external'|'both' while the CHECK allows 'owned'|'leased', and
// target_event_types was a string while the column is TEXT[]. Deriving removes
// the possibility, and the drift guard in assert-schema.js pins the values.
// ---------------------------------------------------------------------------
import type { Database } from './supabase'

type Tables = Database['public']['Tables']
type Row<T extends keyof Tables> = Tables[T]['Row']

// Contact Types
export type ContactType = NonNullable<Row<'contacts'>['type']>
export type Contact = Row<'contacts'>

// Inventory Types
export type InventoryItem = Row<'inventory_items'>

// Pricing Types
export type RentalType = Row<'pricing_rates'>['rental_type']
export type PricingRate = Row<'pricing_rates'> & {
  inventory_item?: Pick<InventoryItem, 'id' | 'name' | 'unique_code'> | null
  special_rates?: SpecialRate[] | null
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
export type EventStatus = NonNullable<Row<'events'>['status']>
export type Event = Row<'events'> & {
  // added by the `customer:contacts(name)` nested select in the dashboard
  customer?: { name: string } | null
}

export type EventItem = Row<'event_items'> & {
  event?: Event | null
  inventory_item?: InventoryItem | null
}

export type ExternalRental = Row<'external_rentals'> & {
  vendor?: Contact | null
  event?: Event | null
}

export type WorkerAssignment = Row<'worker_assignments'> & {
  worker?: Contact | null
  event?: Event | null
}

export type Payment = Row<'payments'> & {
  contact?: Contact | null
  event?: Event | null
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

// System Settings Type
export type SystemSettings = Row<'system_settings'>

// Staff Types
export type EmploymentType = NonNullable<Row<'staff_members'>['employment_type']>
export type StaffMember = Row<'staff_members'>

export interface PayrollRun {
  id: string
  period_from: string
  period_to: string
  payroll_month: string
  gross_total: number
  deduction_total: number
  net_total: number
  status: 'draft' | 'approved' | 'paid'
  created_at: string
}

// Rental Types
export type RentalContract = Row<'rental_contracts'> & {
  party?: Contact | null
  event?: Event | null
}

// Invoice Types
export interface Invoice {
  id: string
  invoice_no: string
  event_id?: string
  client_id: string
  issue_date: string
  due_date?: string
  subtotal: number
  grand_total: number
  amount_paid: number
  amount_due: number
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
  created_at: string
}

// Auth / Access Control Types
// Mirrors the roles enforced by public.profiles.role and the
// public.can_assign_role() hierarchy in supabase/schema.sql.
export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'staff'

export const USER_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'accountant',
  'staff',
]

// Human-facing labels. 'owner'/'manager' were the pre-migration names.
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  accountant: 'Accountant',
  staff: 'Staff',
}

// Rank mirrors public.role_rank(). Higher outranks lower. Kept in step with the
// database so the UI can grey out roles the current user is not allowed to
// hand out, without a round trip.
export const USER_ROLE_RANK: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  accountant: 2,
  staff: 1,
}

export interface Profile {
  id: string
  user_id: string
  email: string
  role: UserRole
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function canAssignRole(actor: UserRole, target: UserRole): boolean {
  return USER_ROLE_RANK[target] > 0 && USER_ROLE_RANK[actor] > USER_ROLE_RANK[target]
}

export function assignableRoles(actor: UserRole): UserRole[] {
  return USER_ROLES.filter((r) => canAssignRole(actor, r))
}

export function hasRole(actor: UserRole | null | undefined, ...allowed: UserRole[]): boolean {
  return !!actor && allowed.includes(actor)
}
