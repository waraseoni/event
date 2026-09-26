'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { Users, UserPlus } from 'lucide-react'

export default function ClientsPage() {
  const { t, language } = useLanguage()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'customer' as const, phone: '', email: '', company_name: '', credit_days: '' })

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const { data, error } = await supabase.from('contacts').select('*').in('type', ['renter', 'customer']).order('name')
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('contacts').insert([{
        name: formData.name,
        type: formData.type,
        phone: formData.phone,
        email: formData.email || null,
        company_name: formData.company_name || null,
        credit_days: formData.credit_days ? parseInt(formData.credit_days) : 0,
      }])
      if (error) throw error
      setIsOpen(false)
      setFormData({ name: '', type: 'customer', phone: '', email: '', company_name: '', credit_days: '' })
      fetchClients()
    } catch {
      alert('Error adding client')
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Users className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Clients' : 'ग्राहक'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Manage renters and customers' : 'किरायेदार और ग्राहक प्रबंधित करें'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0">
            <button onClick={() => setIsOpen(true)} className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              <UserPlus className="h-4 w-4 mr-2" />{language === 'en' ? 'Add Client' : 'ग्राहक जोड़ें'}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add Client' : 'ग्राहक जोड़ें'}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Name *' : 'नाम *'}</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Type' : 'प्रकार'}</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 border rounded-md">
                    <option value="customer">Customer</option>
                    <option value="renter">Renter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Phone *' : 'फ़ोन *'}</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Email' : 'ईमेल'}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Credit Days' : 'क्रेडिट दिन'}</label>
                  <input type="number" value={formData.credit_days} onChange={(e) => setFormData({...formData, credit_days: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Company Name' : 'कंपनी नाम'}</label>
                <input type="text" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
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
              {clients.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.company_name || c.type} · {c.phone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {c.type}
                  </span>
                </div>
              ))}
              {clients.length === 0 && <p className="text-muted-foreground text-center py-8">No clients yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
