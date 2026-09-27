'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { Briefcase, Plus } from 'lucide-react'
import type { EmploymentType } from '@/types'

const EMPLOYMENT_TYPES: EmploymentType[] = ['permanent', 'contract', 'daily']

const EMPTY_FORM = {
  name: '',
  designation: '',
  employment_type: 'daily' as EmploymentType,
  base_salary: '',
  daily_wage: '',
}

export default function StaffPage() {
  const { t, language } = useLanguage()
  const [staff, setStaff] = useState<any[]>([])
  const [payroll, setPayroll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)

  async function fetchStaff() {
    try {
      // the display name lives on contacts, so join it in
      const { data, error } = await supabase
        .from('staff_members')
        .select('*, contact:contacts(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  async function fetchPayroll() {
    try {
      const { data, error } = await supabase.from('payroll_runs').select('*').order('period_from', { ascending: false }).limit(6)
      if (error) throw error
      setPayroll(data || [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchStaff()
    fetchPayroll()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError(language === 'en' ? 'Please enter a name' : 'कृपया नाम दर्ज करें')
      return
    }
    setError('')
    try {
      // staff_members has no `name` column - the person lives in `contacts`.
      // The old form collected a name and then dropped it on the floor, so
      // every staff row rendered blank. Reuse an existing worker contact with
      // the same name, otherwise create one, then link to it.
      const name = formData.name.trim()
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('name', name)
        .eq('type', 'worker')
        .maybeSingle()

      let contactId = existing?.id ?? null
      if (!contactId) {
        const { data: created, error: contactError } = await supabase
          .from('contacts')
          .insert({ name, type: 'worker', phone: '' })
          .select('id')
          .single()
        if (contactError) throw contactError
        contactId = created.id
      }

      const { error: err } = await supabase.from('staff_members').insert([{
        contact_id: contactId,
        designation: formData.designation || null,
        employment_type: formData.employment_type as EmploymentType,
        base_salary: parseFloat(formData.base_salary) || 0,
        daily_wage: parseFloat(formData.daily_wage) || 0,
        status: 'active',
      }])
      if (err) throw err
      setIsOpen(false)
      setFormData({ name: '', designation: '', employment_type: 'daily', base_salary: '', daily_wage: '' })
      fetchStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Briefcase className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Staff & Payroll' : 'कर्मचारी और वेतन'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Manage staff members and payroll' : 'कर्मचारी और वेतन प्रबंधित करें'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0">
            <button onClick={() => setIsOpen(true)} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              <Plus className="h-4 w-4 mr-2" />{language === 'en' ? 'Add Staff' : 'कर्मचारी जोड़ें'}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add Staff' : 'कर्मचारी जोड़ें'}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Name *' : 'नाम *'}</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Designation' : 'पद'}</label>
                  <input type="text" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Employment Type' : 'नियुक्ति प्रकार'}</label>
                  <select value={formData.employment_type} onChange={(e) => setFormData({...formData, employment_type: e.target.value as EmploymentType})} className="w-full px-3 py-2 border rounded-md">
                    {EMPLOYMENT_TYPES.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Base Salary (₹)' : 'बेस सैलरी'}</label>
                  <input type="number" value={formData.base_salary} onChange={(e) => setFormData({...formData, base_salary: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Daily Wage (₹)' : 'दैनिक वेतन'}</label>
                  <input type="number" value={formData.daily_wage} onChange={(e) => setFormData({...formData, daily_wage: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              {error && <p className="text-sm text-destructive break-words">{error}</p>}
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-md border py-2 text-sm font-medium hover:bg-muted">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-700">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{language === 'en' ? 'Staff Members' : 'कर्मचारी'} ({staff.length})</CardTitle></CardHeader>
          <CardContent>
            {staff.length === 0 ? <p className="text-muted-foreground text-center py-4">No staff added yet</p> : (
              <div className="space-y-2">
                {staff.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium">{s.contact?.name ?? '—'}</span>
                      <span className="text-muted-foreground ml-2">{s.designation}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{language === 'en' ? 'Recent Payroll' : 'हालिया वेतन'}</CardTitle></CardHeader>
          <CardContent>
            {payroll.length === 0 ? <p className="text-muted-foreground text-center py-4">No payroll runs yet</p> : (
              <div className="space-y-2">
                {payroll.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <div>
                      <span className="font-medium">{p.payroll_month}</span>
                      <span className="text-muted-foreground ml-2">{p.period_from} → {p.period_to}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(p.net_total, language)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
