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
  revalidatePath('/inventory')
  return data
}

export async function updateInventoryItem(id: string, raw: unknown) {
  const item = inventoryItemSchema.partial().parse(raw)
  const sb = await supabaseRequest()
  const { data, error } = await sb.from('inventory_items').update(item).eq('id', id).select().single()
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
