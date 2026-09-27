'use server'

import { revalidatePath } from 'next/cache'
import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

async function throwOnError({ data, error }: { data: unknown; error: Error | null }) {
  if (error) throw error
  return data
}

export async function getEvents() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('events').select('*').order('event_date', { ascending: false }))
  return data as R['events']['Row'][]
}

export async function createEvent(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const event = {
    name: String(raw.name ?? ''),
    client_id: typeof raw.client_id === 'string' ? raw.client_id : null,
    event_type: (typeof raw.event_type === 'string') ? raw.event_type : null,
    start_datetime: String(raw.start_datetime ?? ''),
    end_datetime: typeof raw.end_datetime === 'string' ? raw.end_datetime : null,
    venue_address: (typeof raw.venue_address === 'string') ? raw.venue_address : null,
    status: (typeof raw.status === 'string') ? raw.status : 'planned',
  }
  const { data, error } = await sb.from('events').insert(event).select().single()
  if (error) throw error
  revalidatePath('/events')
  return data
}

export async function deleteEvent(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('events').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/events')
}

export async function getPricing() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('pricing_rates').select('*').order('created_at', { ascending: false }))
  return data as R['pricing_rates']['Row'][]
}

export async function createPricing(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const pricing = {
    inventory_item_id: typeof raw.inventory_item_id === 'string' ? raw.inventory_item_id : null,
    rental_type: (['daily', 'weekly', 'monthly', 'per_event'] as const).includes(raw.rental_type as any) ? raw.rental_type : 'daily',
    rate: Number(raw.rate) || 0,
    security_deposit: Number(raw.security_deposit) || 0,
  }
  const { data, error } = await sb.from('pricing_rates').insert(pricing).select().single()
  if (error) throw error
  revalidatePath('/pricing')
  return data
}

export async function deletePricing(id: string) {
  const sb = await supabaseRequest()
  const { error } = await sb.from('pricing_rates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/pricing')
}
