import { supabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

// ---------- helpers ----------
async function throwOnError({ data, error }: { data: unknown; error: Error | null }) {
  if (error) throw error
  return data
}

export async function getInventoryItems() {
  const data = await throwOnError(await supabaseServer.from('inventory_items').select('*').order('created_at', { ascending: false }))
  return data as R['inventory_items']['Row'][]
}

export async function getInventoryItem(id: string) {
  const data = await throwOnError(await supabaseServer.from('inventory_items').select('*').eq('id', id).single())
  return data as R['inventory_items']['Row']
}

export async function createInventoryItem(raw: unknown) {
  const item = z.object({
    name: z.string().min(2), category_id: z.string().optional(), unique_code: z.string().optional(),
    company: z.string().optional(), model: z.string().optional(), scope: z.string().optional(),
    item_type: z.enum(['owned', 'leased']).optional(), target_event_types: z.array(z.string()).optional(),
    estimated_rent_price: z.coerce.number().min(0).optional(), min_price: z.coerce.number().min(0).optional(),
    security_deposit: z.coerce.number().min(0).optional(), hsn_code: z.string().optional(),
    images: z.array(z.string()).optional(), total_quantity: z.coerce.number().min(0), unit: z.string().optional(),
    location_id: z.string().optional(), purchase_price: z.coerce.number().min(0).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(), reorder_level: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  }).parse(raw)
  const { data, error } = await supabaseServer.from('inventory_items').insert({ ...item, status: 'available' }).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data
}

export async function updateInventoryItem(id: string, raw: unknown) {
  const item = z.object({
    name: z.string().min(2).optional(), category_id: z.string().optional(), unique_code: z.string().optional(),
    company: z.string().optional(), model: z.string().optional(), scope: z.string().optional(),
    item_type: z.enum(['owned', 'leased']).optional(), target_event_types: z.array(z.string()).optional(),
    estimated_rent_price: z.coerce.number().min(0).optional(), min_price: z.coerce.number().min(0).optional(),
    security_deposit: z.coerce.number().min(0).optional(), hsn_code: z.string().optional(),
    images: z.array(z.string()).optional(), total_quantity: z.coerce.number().min(0).optional(), unit: z.string().optional(),
    location_id: z.string().optional(), purchase_price: z.coerce.number().min(0).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(), reorder_level: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  }).partial().parse(raw)
  const { data, error } = await supabaseServer.from('inventory_items').update(item).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/inventory')
  return data
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabaseServer.from('inventory_items').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}

export async function getInventoryCategories() {
  const data = await throwOnError(await supabaseServer.from('item_categories').select('*').order('sort_order'))
  return data as R['item_categories']['Row'][]
}

export async function getInventoryLocations() {
  const data = await throwOnError(await supabaseServer.from('item_locations').select('*').order('created_at', { ascending: false }))
  return data as R['item_locations']['Row'][]
}

export async function getStockMovements(itemId?: string) {
  const q = supabaseServer.from('stock_movements').select('*').order('created_at', { ascending: false })
  if (itemId) q.eq('item_id', itemId)
  const data = await throwOnError(await q)
  return data as R['stock_movements']['Row'][]
}

export async function createStockMovement(raw: unknown) {
  const m = z.object({ item_id: z.string(), movement: z.enum(['purchase','rent_in','rent_out','event_pickup','event_return','transfer','adjust','damage','retire','maintenance']), quantity: z.coerce.number(), notes: z.string().optional(), reference_type: z.string().optional(), reference_id: z.string().optional(), party_id: z.string().optional() }).parse(raw)
  const { data: item } = await supabaseServer.from('inventory_items').select('total_quantity').eq('id', m.item_id).single()
  const running = (item?.total_quantity ?? 0) + m.quantity
  const { data, error } = await supabaseServer.from('stock_movements').insert({ ...m, running_balance: running }).select().single()
  if (error) throw error
  await supabaseServer.from('inventory_items').update({ total_quantity: running }).eq('id', m.item_id)
  return data
}
