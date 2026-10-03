'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

const maintenanceSchema = z.object({
  item_id: z.string().uuid(),
  maintenance_type: z.enum(['repair', 'service', 'calibration', 'upgrade', 'other']).default('service'),
  description: z.string().max(1000).optional(),
  cost: z.coerce.number().min(0).default(0),
  vendor_id: z.string().uuid().nullable().optional(),
  started_at: z.string().min(1),
  notes: z.string().max(1000).optional(),
})

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Open a maintenance record. The item goes to 'maintenance' status so the
 * Phase 2 availability engine treats it as unavailable, and the next due date
 * is scheduled from the item's service interval.
 */
export async function createMaintenance(raw: unknown) {
  const input = maintenanceSchema.parse(raw)
  const sb = await supabaseRequest()

  const { data: item, error: readError } = await sb
    .from('inventory_items')
    .select('maintenance_interval_days')
    .eq('id', input.item_id)
    .single()
  if (readError) throw readError
  const interval = Number(
    (item as { maintenance_interval_days: number | null }).maintenance_interval_days ?? 0
  )

  const { data, error } = await sb.from('maintenance_records').insert(input).select().single()
  if (error) throw error

  const itemPatch: Record<string, unknown> = { status: 'maintenance' }
  if (interval > 0) itemPatch.next_maintenance_date = addDays(input.started_at, interval)
  const { error: itemError } = await sb.from('inventory_items').update(itemPatch).eq('id', input.item_id)
  if (itemError) throw itemError

  revalidatePath('/inventory')
  return data as R['maintenance_records']['Row']
}

const completeSchema = z.object({
  completed_at: z.string().min(1).optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Close a maintenance record. The item returns to 'available' and its
 * last/next maintenance dates roll forward from the completion date.
 */
export async function completeMaintenance(id: string, raw: unknown = {}) {
  const input = completeSchema.parse(raw)
  const sb = await supabaseRequest()

  const { data: record, error: readError } = await sb
    .from('maintenance_records')
    .select('item_id')
    .eq('id', id)
    .single()
  if (readError) throw readError
  const itemId = (record as { item_id: string }).item_id

  const completedAt = input.completed_at ?? new Date().toISOString()
  const patch: Record<string, unknown> = { completed_at: completedAt }
  if (input.notes !== undefined) patch.notes = input.notes
  const { data, error } = await sb.from('maintenance_records').update(patch).eq('id', id).select().single()
  if (error) throw error

  const { data: item, error: itemReadError } = await sb
    .from('inventory_items')
    .select('maintenance_interval_days')
    .eq('id', itemId)
    .single()
  if (itemReadError) throw itemReadError
  const interval = Number(
    (item as { maintenance_interval_days: number | null }).maintenance_interval_days ?? 0
  )
  const itemPatch: Record<string, unknown> = {
    status: 'available',
    last_maintenance_date: completedAt.slice(0, 10),
  }
  if (interval > 0) itemPatch.next_maintenance_date = addDays(completedAt, interval)
  const { error: itemError } = await sb.from('inventory_items').update(itemPatch).eq('id', itemId)
  if (itemError) throw itemError

  revalidatePath('/inventory')
  return data as R['maintenance_records']['Row']
}

export async function deleteMaintenance(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('maintenance_records').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/inventory')
}
