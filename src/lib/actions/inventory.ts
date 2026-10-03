'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

// ---------- helpers ----------
async function throwOnError({ data, error }: { data: unknown; error: Error | null }) {
  if (error) throw error
  return data
}

// ---------- schemas ----------
const inventoryItemSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  description: z.string().optional(),
  company: z.string().optional(),
  model: z.string().optional(),
  scope: z.string().optional(),
  item_type: z.enum(['owned', 'leased']).optional(),
  target_event_types: z.array(z.string()).optional(),
  estimated_rent_price: z.coerce.number().min(0).optional(),
  min_price: z.coerce.number().min(0).optional(),
  security_deposit: z.coerce.number().min(0).optional(),
  total_quantity: z.coerce.number().min(0).default(1),
  unit: z.string().default('piece'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  location: z.string().optional(),
  purchase_price: z.coerce.number().min(0).optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
})

function generateUniqueCode(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

// ---------- actions ----------
export async function getInventoryItems() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('inventory_items').select('*').order('created_at', { ascending: false }))
  return data as R['inventory_items']['Row'][]
}

export async function getInventoryItem(id: string) {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('inventory_items').select('*').eq('id', id).single())
  return data as R['inventory_items']['Row']
}

export async function createInventoryItem(raw: unknown) {
  const item = inventoryItemSchema.parse(raw)
  const payload = { ...item, unique_code: generateUniqueCode(), status: 'available' as const, available_quantity: item.total_quantity }
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('inventory_items').insert(payload).select().single()
  if (error) throw error
  // AC: every quantity level must have a matching ledger row, including the
  // opening stock. A direct movement INSERT (not p_adjust_stock) is correct
  // here because the quantities were already set by the INSERT above — the
  // guard trigger only watches UPDATE, and calling p_adjust_stock would count
  // the same stock twice.
  const opening = {
    item_id: (data as { id: string }).id,
    movement: 'purchase',
    quantity: item.total_quantity,
    running_balance: item.total_quantity,
    notes: 'opening stock',
  }
  const { error: ledgerError } = await sb.from('stock_movements').insert(opening)
  if (ledgerError) throw ledgerError
  revalidatePath('/inventory')
  return data
}

export async function updateInventoryItem(id: string, raw: unknown) {
  const item = inventoryItemSchema.partial().parse(raw)
  // Quantity is ledger-managed and never edited directly (zod strips unknown
  // keys anyway): any change to total_quantity is routed through
  // p_adjust_stock so a stock_movements row is written. The DB guard trigger
  // would reject a direct UPDATE anyway — this path turns that rejection into
  // a proper adjustment with a clear movement reason.
  const { total_quantity, ...rest } = item
  const sb = await supabaseRequest()
  if (typeof total_quantity === 'number') {
    const { data: current, error: readError } = await sb
      .from('inventory_items')
      .select('total_quantity')
      .eq('id', id)
      .single()
    if (readError) throw readError
    const delta = total_quantity - Number((current as { total_quantity: number | null }).total_quantity ?? 0)
    if (delta !== 0) {
      const { error: rpcError } = await sb.rpc('p_adjust_stock', {
        p_item_id: id,
        p_movement: 'adjust',
        p_quantity: delta,
        p_notes: 'quantity edited on item form',
      })
      if (rpcError) throw rpcError
    }
  }
  if (Object.keys(rest).length === 0) {
    const { data, error } = await sb.from('inventory_items').select().eq('id', id).single()
    if (error) throw error
    revalidatePath('/inventory')
    return data
  }
  const { data, error } = await sb.from('inventory_items').update(rest).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data
}

export async function deleteInventoryItem(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('inventory_items').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

export async function getInventoryCategories() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('item_categories').select('*').order('sort_order'))
  return data as R['item_categories']['Row'][]
}

export async function getInventoryLocations() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('item_locations').select('*').order('created_at', { ascending: false }))
  return data as R['item_locations']['Row'][]
}

export async function getStockMovements(itemId?: string) {
  const sb = await supabaseRequest()
  const q = sb.from('stock_movements').select('*').order('created_at', { ascending: false })
  if (itemId) q.eq('item_id', itemId)
  const data = await throwOnError(await q)
  return data as R['stock_movements']['Row'][]
}

// ---------- stock adjustments (the only sanctioned quantity write path) ----------
const movementSchema = z.enum([
  'purchase', 'rent_in', 'rent_out', 'event_pickup', 'event_return',
  'transfer', 'adjust', 'damage', 'retire', 'maintenance',
])

const moveStockSchema = z.object({
  itemId: z.string().uuid(),
  movement: movementSchema,
  quantity: z.coerce.number().int().refine((n) => n !== 0, 'quantity must be non-zero'),
  referenceType: z.string().max(60).optional(),
  referenceId: z.string().uuid().optional(),
  partyId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
})

export async function moveStock(raw: unknown) {
  const input = moveStockSchema.parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.rpc('p_adjust_stock', {
    p_item_id: input.itemId,
    p_movement: input.movement,
    p_quantity: input.quantity,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_party_id: input.partyId ?? null,
    p_notes: input.notes ?? null,
  })
  if (error) throw error
  revalidatePath('/inventory')
  const row = (Array.isArray(data) ? data[0] : data) as R['stock_movements']['Row']
  return row
}

/**
 * Retire an item: drain whatever is still on hand through the ledger (movement
 * 'retire') and flip status to retired. A retired item keeps its history but
 * never appears as available again.
 */
export async function retireItem(id: string) {
  const sb = await supabaseRequest()
  const { data: current, error: readError } = await sb
    .from('inventory_items')
    .select('available_quantity')
    .eq('id', id)
    .single()
  if (readError) throw readError
  const onHand = Number((current as { available_quantity: number | null }).available_quantity ?? 0)
  if (onHand > 0) {
    const { error: rpcError } = await sb.rpc('p_adjust_stock', {
      p_item_id: id,
      p_movement: 'retire',
      p_quantity: -onHand,
      p_notes: 'item retired',
    })
    if (rpcError) throw rpcError
  }
  const { data, error } = await sb
    .from('inventory_items')
    .update({ status: 'retired' })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['inventory_items']['Row']
}

const bulkPatchSchema = inventoryItemSchema
  .partial()
  .omit({ total_quantity: true, serial_number: true })

/**
 * Same non-quantity edit applied to many items at once. Quantity keys are
 * rejected by the schema — bulk qty edits must go through moveStock per item.
 */
export async function bulkUpdateItems(ids: string[], raw: unknown) {
  const patch = bulkPatchSchema.parse(raw)
  if (!Array.isArray(ids) || ids.length === 0) throw new Error('no items selected')
  if (Object.keys(patch).length === 0) throw new Error('nothing to update')
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('inventory_items').update(patch).in('id', ids).select('id')
  if (error) throw error
  revalidatePath('/inventory')
  return (data as { id: string }[]).length
}

// ---------- categories (hierarchical) ----------
const categorySchema = z.object({
  name: z.string().min(2).max(120),
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().max(40).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().optional(),
})

export async function createCategory(raw: unknown) {
  const input = categorySchema.parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('item_categories').insert(input).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['item_categories']['Row']
}

export async function updateCategory(id: string, raw: unknown) {
  const input = categorySchema.partial().parse(raw)
  if (input.parent_id === id) throw new Error('a category cannot be its own parent')
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('item_categories').update(input).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['item_categories']['Row']
}

export async function deleteCategory(id: string) {
  const sb = await supabaseRequest()
  // inventory_items.category_id has no FK, so clear it manually — otherwise
  // the deleted category would haunt the item rows as a dangling uuid.
  const { error: clearError } = await sb.from('inventory_items').update({ category_id: null }).eq('category_id', id)
  if (clearError) throw clearError
  const { error } = await sb.from('item_categories').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

// ---------- locations (godowns) ----------
const locationSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  pincode: z.string().max(12).optional(),
  is_active: z.boolean().optional(),
})

export async function createLocation(raw: unknown) {
  const input = locationSchema.parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('item_locations').insert(input).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['item_locations']['Row']
}

export async function updateLocation(id: string, raw: unknown) {
  const input = locationSchema.partial().parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('item_locations').update(input).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['item_locations']['Row']
}

export async function deleteLocation(id: string) {
  const sb = await supabaseRequest()
  const { error: clearError } = await sb.from('inventory_items').update({ location_id: null }).eq('location_id', id)
  if (clearError) throw clearError
  const { error } = await sb.from('item_locations').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

// ---------- serials + QR ----------
const serialSchema = z.object({
  item_id: z.string().uuid(),
  serial_code: z.string().min(1).max(120),
  qr_code: z.string().max(300).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  status: z.enum(['available', 'rented', 'maintenance', 'retired']).optional(),
})

export async function createSerial(raw: unknown) {
  const input = serialSchema.parse(raw)
  const sb = await supabaseRequest()
  const payload = { ...input, qr_code: input.qr_code ?? `QR:${input.serial_code}` }
  const { data, error } = await sb.from('item_serials').insert(payload).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['item_serials']['Row']
}

export async function deleteSerial(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('item_serials').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

export async function listSerials(itemId: string) {
  const sb = await supabaseRequest()
  const data = await throwOnError(
    await sb.from('item_serials').select('*').eq('item_id', itemId).order('created_at', { ascending: false })
  )
  return data as R['item_serials']['Row'][]
}

// ---------- rate card (pricing_rates + special_rates) ----------
const pricingRateSchema = z.object({
  inventory_item_id: z.string().uuid(),
  rental_type: z.enum(['daily', 'weekly', 'monthly', 'per_event']),
  rate: z.coerce.number().min(0),
  security_deposit: z.coerce.number().min(0).optional(),
  min_rental_days: z.coerce.number().int().min(1).default(1),
  max_rental_days: z.coerce.number().int().min(1).nullable().optional(),
})

export async function createPricingRate(raw: unknown) {
  const input = pricingRateSchema.parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('pricing_rates').insert(input).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['pricing_rates']['Row']
}

export async function deletePricingRate(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('pricing_rates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

const specialRateSchema = z.object({
  item_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(120),
  rate_type: z.enum(['multiplier', 'fixed']).default('multiplier'),
  rate_value: z.coerce.number().min(0),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export async function createSpecialRate(raw: unknown) {
  const input = specialRateSchema.parse(raw)
  if (new Date(input.end_date) < new Date(input.start_date)) {
    throw new Error('end date cannot be before start date')
  }
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('special_rates').insert(input).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data as R['special_rates']['Row']
}

export async function deleteSpecialRate(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('special_rates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

// ---------- CSV export / import ----------
const CSV_COLUMNS = [
  'name', 'category', 'company', 'model', 'scope', 'item_type', 'description',
  'estimated_rent_price', 'min_price', 'security_deposit', 'total_quantity',
  'unit', 'condition', 'location', 'serial_number', 'hsn_code', 'target_event_types',
] as const

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvLine(values: unknown[]): string {
  return values.map(csvEscape).join(',')
}

/**
 * Export every item matching the filter as CSV. Uses the same server-side
 * search as the list page so "export what I see" is literally true.
 */
export async function exportInventoryCsv(filter: {
  search?: string | null
  categoryId?: string | null
  company?: string | null
  itemType?: string | null
  status?: string | null
  locationId?: string | null
  minPrice?: number | null
  maxPrice?: number | null
}) {
  const sb = await supabaseRequest()
  const { data, error } = await sb.rpc('fn_inventory_search', {
    p_search: filter.search?.trim() ? filter.search.trim() : null,
    p_category_id: filter.categoryId ?? null,
    p_company: filter.company?.trim() ? filter.company.trim() : null,
    p_item_type: filter.itemType ?? null,
    p_status: filter.status ?? null,
    p_location_id: filter.locationId ?? null,
    p_min_price: filter.minPrice ?? null,
    p_max_price: filter.maxPrice ?? null,
    p_limit: 10000,
    p_offset: 0,
  })
  if (error) throw error
  const rows = (data ?? []) as Record<string, unknown>[]
  const lines = [
    csvLine([...CSV_COLUMNS]),
    ...rows.map((r) =>
      csvLine(
        CSV_COLUMNS.map((c) =>
          c === 'target_event_types' ? ((r[c] as string[] | null) ?? []).join('|') : r[c]
        )
      )
    ),
  ]
  return { filename: `inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv: lines.join('\n') }
}

function parseCsv(text: string): { header: string[]; records: string[][]; error?: string } {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const push = () => {
    row.push(field)
    field = ''
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      push()
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      push()
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  push()
  if (row.length > 1 || row[0] !== '') rows.push(row)
  if (inQuotes) return { header: [], records: [], error: 'unterminated quoted field' }
  if (rows.length === 0) return { header: [], records: [], error: 'empty file' }
  return { header: rows[0].map((h) => h.trim()), records: rows.slice(1) }
}

const csvRowSchema = inventoryItemSchema.extend({
  target_event_types: z.union([z.array(z.string()), z.string()]).optional(),
})

export interface CsvImportReport {
  valid: number
  errors: { line: number; issues: string }[]
}

/** Validate a CSV without writing anything — the import wizard shows this first. */
export async function importInventoryCsvDryRun(csvText: string): Promise<CsvImportReport> {
  const { header, records, error } = parseCsv(csvText)
  if (error) return { valid: 0, errors: [{ line: 0, issues: error }] }
  const missing = (['name', 'category'] as const).filter((c) => !header.includes(c))
  if (missing.length > 0) {
    return { valid: 0, errors: [{ line: 1, issues: `missing required columns: ${missing.join(', ')}` }] }
  }
  const errors: { line: number; issues: string }[] = []
  let valid = 0
  records.forEach((rec, i) => {
    const obj: Record<string, unknown> = {}
    header.forEach((h, j) => {
      obj[h] = rec[j] ?? ''
    })
    if (typeof obj.target_event_types === 'string') {
      obj.target_event_types = (obj.target_event_types as string).split('|').map((s) => s.trim()).filter(Boolean)
    }
    for (const k of ['estimated_rent_price', 'min_price', 'security_deposit', 'total_quantity']) {
      if (obj[k] === '') delete obj[k]
    }
    const parsed = csvRowSchema.safeParse(obj)
    if (parsed.success) valid++
    else {
      errors.push({
        line: i + 2,
        issues: parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      })
    }
  })
  return { valid, errors }
}

/** Insert every valid row (each gets its opening ledger row via createInventoryItem). */
export async function importInventoryCsvApply(csvText: string) {
  const { header, records, error } = parseCsv(csvText)
  if (error) throw new Error(error)
  let inserted = 0
  const errors: { line: number; issues: string }[] = []
  for (let i = 0; i < records.length; i++) {
    const obj: Record<string, unknown> = {}
    header.forEach((h, j) => {
      obj[h] = records[i][j] ?? ''
    })
    if (typeof obj.target_event_types === 'string') {
      obj.target_event_types = (obj.target_event_types as string).split('|').map((s) => s.trim()).filter(Boolean)
    }
    for (const k of ['estimated_rent_price', 'min_price', 'security_deposit', 'total_quantity']) {
      if (obj[k] === '') delete obj[k]
    }
    const parsed = csvRowSchema.safeParse(obj)
    if (!parsed.success) {
      errors.push({
        line: i + 2,
        issues: parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      })
      continue
    }
    try {
      await createInventoryItem(parsed.data)
      inserted++
    } catch (e) {
      errors.push({ line: i + 2, issues: e instanceof Error ? e.message : String(e) })
    }
  }
  revalidatePath('/inventory')
  return { inserted, errors }
}
