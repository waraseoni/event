'use server'

import { revalidatePath } from 'next/cache'
import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'

type R = Database['public']['Tables']

async function throwOnError({ data, error }: { data: unknown; error: Error | null }) {
  if (error) throw error
  return data
}

export async function getClients() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('contacts').select('*').in('type', ['renter', 'customer']).order('name'))
  return data as R['contacts']['Row'][]
}

export async function createClient(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const contact = {
    name: String(raw.name ?? ''),
    type: (raw.type === 'renter' || raw.type === 'customer' || raw.type === 'vendor' || raw.type === 'other') ? raw.type : 'customer',
    phone: String(raw.phone ?? ''),
    email: (typeof raw.email === 'string') ? raw.email : null,
    company_name: (typeof raw.company_name === 'string') ? raw.company_name : null,
    credit_days: Number(raw.credit_days) || 0,
  }
  const { data, error } = await sb.from('contacts').insert(contact).select().single()
  if (error) throw error
  revalidatePath('/clients')
  return data
}

export async function getPayrollRuns() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('payroll_runs').select('*').order('period_from', { ascending: false }).limit(6))
  return data as R['payroll_runs']['Row'][]
}

export async function createPayrollRun(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const run = {
    period_from: String(raw.period_from ?? ''),
    period_to: String(raw.period_to ?? ''),
    staff_ids: Array.isArray(raw.staff_ids) ? raw.staff_ids : [],
    status: (raw.status === 'draft' || raw.status === 'approved' || raw.status === 'paid') ? raw.status : 'draft',
  }
  const { data, error } = await sb.from('payroll_runs').insert(run).select().single()
  if (error) throw error
  revalidatePath('/staff')
  return data
}

export async function getRentalContracts() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('rental_contracts').select('*').order('created_at', { ascending: false }))
  return data as R['rental_contracts']['Row'][]
}

export async function createRentalContract(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const contract = {
    party_id: String(raw.party_id ?? ''),
    direction: (raw.direction === 'in' || raw.direction === 'out') ? raw.direction : 'out',
    status: (raw.status === 'draft' || raw.status === 'active' || raw.status === 'closed') ? raw.status : 'draft',
    contract_no: String(raw.contract_no ?? ''),
    start_date: raw.start_date ?? null,
    end_date: raw.end_date ?? null,
    security_deposit: Number(raw.security_deposit) || 0,
    notes: (typeof raw.notes === 'string') ? raw.notes : null,
  }
  const { data, error } = await sb.from('rental_contracts').insert(contract).select().single()
  if (error) throw error
  revalidatePath('/rentals')
  return data
}

export async function getInvoices() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('invoices').select('*').order('issue_date', { ascending: false }))
  return data as R['invoices']['Row'][]
}
