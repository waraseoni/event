'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { Truck, Plus } from 'lucide-react'
import type { Database } from '@/types/supabase'

type RentalInsert = Database['public']['Tables']['rental_contracts']['Insert']
type ContractRateType = NonNullable<RentalInsert['rate_type']>

const RATE_TYPES: ContractRateType[] = [
  'daily',
  'weekly',
  'monthly',
  'per_event',
  'fixed',
]

const EMPTY_FORM = {
  direction: 'out' as 'in' | 'out',
  party_id: '',
  start_date: '',
  end_date: '',
  rate_type: 'daily' as ContractRateType,
  rate: '',
  total_amount: '',
  security_deposit: '',
  notes: '',
}

// RC-YYYYMMDD-XXXX. Human-readable and unique enough without a sequence object.
function nextContractNo(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `RC-${ymd}-${suffix}`
}

export default function RentalsPage() {
  const { t, language } = useLanguage()
  const [rentals, setRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)

  async function fetchRentals() {
    try {
      const { data, error } = await supabase.from('rental_contracts').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setRentals(data || [])
    } catch (error) {
      console.error('Error fetching rentals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRentals()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    // party_id is NOT NULL with an FK to contacts; the old code sent `|| null`,
    // so an empty field produced a constraint violation instead of a message.
    if (!formData.party_id) {
      setError(language === 'en' ? 'Please choose a party' : 'कृपया पार्टी चुनें')
      return
    }
    setError('')
    try {
      const { error: err } = await supabase.from('rental_contracts').insert([{
        direction: formData.direction,
        party_id: formData.party_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        rate_type: formData.rate_type,
        rate: parseFloat(formData.rate) || 0,
        total_amount: parseFloat(formData.total_amount) || 0,
        security_deposit: parseFloat(formData.security_deposit) || 0,
        // contract_no is NOT NULL with no default, so the form has to mint one.
        // The list used to render `r.contract_no || r.id`, which is why every
        // row showed a raw UUID.
        contract_no: nextContractNo(),
        contract_date: new Date().toISOString().split('T')[0],
        status: 'requested',
        notes: formData.notes || null,
      }])
      if (err) throw err
      setIsOpen(false)
      setFormData({ direction: 'out', party_id: '', start_date: '', end_date: '', rate_type: 'daily', rate: '', total_amount: '', security_deposit: '', notes: '' })
      fetchRentals()
    } catch {
      alert('Error adding rental')
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Truck className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Rentals' : 'किराया'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Manage rental contracts' : 'किराया अनुबंध प्रबंधित करें'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0">
            <button onClick={() => setIsOpen(true)} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              <Plus className="h-4 w-4 mr-2" />{language === 'en' ? 'New Contract' : 'नया अनुबंध'}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'New Rental Contract' : 'नया किराया अनुबंध'}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Direction' : 'दिशा'}</label>
                <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value as any})} className="w-full px-3 py-2 border rounded-md">
                  <option value="out">Out (to client)</option>
                  <option value="in">In (from vendor)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Party/Client ID' : 'पार्टी/ग्राहक ID'}</label>
                <input type="text" value={formData.party_id} onChange={(e) => setFormData({...formData, party_id: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Start Date' : 'प्रारंभ तिथि'}</label>
                  <input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'End Date' : 'समाप्ति तिथि'}</label>
                  <input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Rate Type' : 'दर प्रकार'}</label>
                  <select value={formData.rate_type} onChange={(e) => setFormData({...formData, rate_type: e.target.value as ContractRateType})} className="w-full px-3 py-2 border rounded-md">
                    {RATE_TYPES.map((rt) => (
                      <option key={rt} value={rt}>{rt.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Rate (₹)' : 'दर'}</label>
                  <input type="number" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Total Amount (₹)' : 'कुल राशि'}</label>
                  <input type="number" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Security Deposit (₹)' : 'सुरक्षा जमा'}</label>
                  <input type="number" value={formData.security_deposit} onChange={(e) => setFormData({...formData, security_deposit: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
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

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : (
            <div className="space-y-4">
              {rentals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{r.contract_no || r.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.direction === 'out' ? '→ Out' : '← In'} · {r.start_date} to {r.end_date} · {formatCurrency(r.total_amount, language)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${r.direction === 'out' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
              {rentals.length === 0 && <p className="text-muted-foreground text-center py-8">No rental contracts yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
