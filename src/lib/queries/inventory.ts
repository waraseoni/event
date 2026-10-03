'use server'

// Read-only data access for the inventory catalog. Marked as server actions
// (like src/lib/actions/*) so client components can call them through the
// TanStack query fns without leaking next/headers into the browser bundle.

import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

export type InventoryRow = R['inventory_items']['Row']
export type CategoryRow = R['item_categories']['Row']
export type LocationRow = R['item_locations']['Row']
export type SerialRow = R['item_serials']['Row']
export type MovementRow = R['stock_movements']['Row']
export type MaintenanceRow = R['maintenance_records']['Row']
export type PricingRow = R['pricing_rates']['Row']
export type SpecialRateRow = R['special_rates']['Row']

export interface ItemFilter {
  search?: string | null
  categoryId?: string | null
  company?: string | null
  itemType?: string | null
  status?: string | null
  locationId?: string | null
  minPrice?: number | null
  maxPrice?: number | null
}

/** Row returned by fn_inventory_search: the item plus the window total. */
export interface SearchRow extends InventoryRow {
  total_count: number
}

function filterParams(f: ItemFilter) {
  return {
    p_search: f.search?.trim() ? f.search.trim() : null,
    p_category_id: f.categoryId ?? null,
    p_company: f.company?.trim() ? f.company.trim() : null,
    p_item_type: f.itemType ?? null,
    p_status: f.status ?? null,
    p_location_id: f.locationId ?? null,
    p_min_price: f.minPrice ?? null,
    p_max_price: f.maxPrice ?? null,
  }
}

/**
 * Server-side search + facets + pagination. The ONLY list path the /inventory
 * page should use at scale — client-side filtering cannot meet the 5000-item
 * latency AC.
 */
export async function listItems(
  filter: ItemFilter = {},
  page = 1,
  pageSize = 50
): Promise<{ rows: SearchRow[]; total: number }> {
  const sb = await supabaseRequest()
  const safePage = Math.max(1, Math.floor(page) || 1)
  const safeSize = Math.min(500, Math.max(1, Math.floor(pageSize) || 50))
  const { data, error } = await sb.rpc('fn_inventory_search', {
    ...filterParams(filter),
    p_limit: safeSize,
    p_offset: (safePage - 1) * safeSize,
  })
  if (error) throw error
  const rows = ((data ?? []) as SearchRow[]).map((r) => ({
    ...r,
    total_count: Number(r.total_count ?? 0),
  }))
  return { rows, total: rows[0]?.total_count ?? 0 }
}

export interface ItemDetail {
  item: InventoryRow
  category: CategoryRow | null
  location: LocationRow | null
  serials: SerialRow[]
  movements: MovementRow[]
  maintenance: MaintenanceRow[]
  rates: PricingRow[]
  specialRates: SpecialRateRow[]
}

/** Everything /inventory/[id] needs, fetched in parallel. */
export async function getItemDetail(id: string): Promise<ItemDetail> {
  const sb = await supabaseRequest()
  const { data: item, error: itemError } = await sb
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single()
  if (itemError) throw itemError
  const row = item as InventoryRow

  const [serials, movements, maintenance, rates, specialRates, category, location] =
    await Promise.all([
      sb
        .from('item_serials')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: false }),
      sb
        .from('stock_movements')
        .select('*')
        .eq('item_id', id)
        .order('created_at', { ascending: false })
        .limit(100),
      sb
        .from('maintenance_records')
        .select('*')
        .eq('item_id', id)
        .order('started_at', { ascending: false }),
      sb
        .from('pricing_rates')
        .select('*')
        .eq('inventory_item_id', id),
      sb
        .from('special_rates')
        .select('*')
        .eq('item_id', id)
        .order('start_date', { ascending: false }),
      row.category_id
        ? sb.from('item_categories').select('*').eq('id', row.category_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.location_id
        ? sb.from('item_locations').select('*').eq('id', row.location_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

  for (const r of [serials, movements, maintenance, rates, specialRates, category, location]) {
    if (r.error) throw r.error
  }

  return {
    item: row,
    category: (category.data as CategoryRow | null) ?? null,
    location: (location.data as LocationRow | null) ?? null,
    serials: (serials.data ?? []) as SerialRow[],
    movements: (movements.data ?? []) as MovementRow[],
    maintenance: (maintenance.data ?? []) as MaintenanceRow[],
    rates: (rates.data ?? []) as PricingRow[],
    specialRates: (specialRates.data ?? []) as SpecialRateRow[],
  }
}

/** Flat list, ordered for tree building in the UI (parents first). */
export async function listCategories(): Promise<CategoryRow[]> {
  const sb = await supabaseRequest()
  const { data, error } = await sb
    .from('item_categories')
    .select('*')
    .order('sort_order')
    .order('name')
  if (error) throw error
  return (data ?? []) as CategoryRow[]
}

export async function listLocations(): Promise<LocationRow[]> {
  const sb = await supabaseRequest()
  const { data, error } = await sb
    .from('item_locations')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as LocationRow[]
}

/** Newest-first ledger for one item (or everything when itemId is omitted). */
export async function stockLedger(itemId?: string, limit = 100): Promise<MovementRow[]> {
  const sb = await supabaseRequest()
  let q = sb.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(limit)
  if (itemId) q = q.eq('item_id', itemId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as MovementRow[]
}

/** Open (uncompleted) maintenance records, newest first. */
export async function listOpenMaintenance(): Promise<(MaintenanceRow & { item_name?: string })[]> {
  const sb = await supabaseRequest()
  const { data, error } = await sb
    .from('maintenance_records')
    .select('*, inventory_items!inner(name)')
    .is('completed_at', null)
    .order('started_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as (MaintenanceRow & { inventory_items: { name: string } | null })[]).map(
    (r) => ({ ...r, item_name: r.inventory_items?.name })
  )
}

/**
 * Items whose next maintenance date falls within the coming `withinDays` days
 * (or is already overdue). Drives /inventory/maintenance.
 */
export async function maintenanceDue(withinDays = 30): Promise<InventoryRow[]> {
  const sb = await supabaseRequest()
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + withinDays)
  const { data, error } = await sb
    .from('inventory_items')
    .select('*')
    .not('next_maintenance_date', 'is', null)
    .lte('next_maintenance_date', horizon.toISOString().slice(0, 10))
    .order('next_maintenance_date')
  if (error) throw error
  return (data ?? []) as InventoryRow[]
}

/**
 * Resolve a scanned code to an item id. Accepts an item unique_code or a
 * serial serial_code/qr_code — this is what "QR scan → item detail page" calls.
 */
export async function lookupItemByCode(rawCode: string): Promise<{ itemId: string } | null> {
  const code = rawCode.trim()
  if (!code) return null
  const sb = await supabaseRequest()

  const { data: item, error: itemError } = await sb
    .from('inventory_items')
    .select('id')
    .ilike('unique_code', code)
    .maybeSingle()
  if (itemError) throw itemError
  if (item) return { itemId: (item as { id: string }).id }

  const { data: serial, error: serialError } = await sb
    .from('item_serials')
    .select('item_id')
    .or(`serial_code.ilike.${code},qr_code.ilike.${code}`)
    .maybeSingle()
  if (serialError) throw serialError
  if (serial) return { itemId: (serial as { item_id: string }).item_id }

  return null
}
