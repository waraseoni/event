'use server'

import { revalidatePath } from 'next/cache'
import { supabaseRequest } from '@/lib/supabase/session'
import type { Database } from '@/types/supabase'
import type { EmploymentType } from '@/types'

type R = Database['public']['Tables']

async function throwOnError({ data, error }: { data: unknown; error: Error | null }) {
  if (error) throw error
  return data
}

export async function getStaff() {
  const sb = await supabaseRequest()
  const data = await throwOnError(await sb.from('staff_members').select('*, contact:contacts(name)').order('created_at', { ascending: false }))
  return data as (R['staff_members']['Row'] & { contact: { name: string | null } | null })[]
}

export async function createStaff(raw: Record<string, unknown>) {
  const sb = await supabaseRequest()
  const name = String(raw.name ?? '').trim()
  if (!name) throw new Error('Name is required')

  const { data: existing } = await sb.from('contacts').select('id').eq('name', name).eq('type', 'worker').maybeSingle()
  let contactId = existing?.id ?? null
  if (!contactId) {
    const { data: created, error: ce } = await sb.from('contacts').insert({ name, type: 'worker', phone: '' }).select('id').single()
    if (ce) throw ce
    contactId = created.id
  }

  const { data, error } = await sb.from('staff_members').insert({
    contact_id: contactId,
    designation: (typeof raw.designation === 'string') ? raw.designation : null,
    employment_type: (['permanent', 'contract', 'daily'] as EmploymentType[]).includes(raw.employment_type as EmploymentType) ? raw.employment_type as EmploymentType : 'daily',
    base_salary: Number(raw.base_salary) || 0,
    daily_wage: Number(raw.daily_wage) || 0,
    status: 'active',
  }).select().single()
  if (error) throw error
  revalidatePath('/staff')
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
    status: (['draft', 'approved', 'paid'] as const).includes(raw.status as any) ? raw.status : 'draft',
  }
  const { data, error } = await sb.from('payroll_runs').insert(run).select().single()
  if (error) throw error
  revalidatePath('/staff')
  return data
}
