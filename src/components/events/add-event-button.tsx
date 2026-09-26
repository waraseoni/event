'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'

export function AddEventButton() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    event_type: '',
    customer_id: '',
    customer_name: '',
    event_date: '',
    venue: '',
    status: 'planned' as const,
    total_amount: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('events').insert([{
        name: formData.name,
        event_type: formData.event_type,
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name || null,
        event_date: formData.event_date || null,
        venue: formData.venue || null,
        status: formData.status,
        total_amount: parseFloat(formData.total_amount) || 0,
        notes: formData.notes || null,
      }])
      if (error) throw error
      setIsOpen(false)
      setFormData({ name: '', event_type: '', customer_id: '', customer_name: '', event_date: '', venue: '', status: 'planned', total_amount: '', notes: '' })
      window.location.reload()
    } catch {
      alert('Error adding event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />{language === 'en' ? 'New Event' : 'नया ईवेंट'}</Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add Event' : 'ईवेंट जोड़ें'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Event Name *' : 'ईवेंट नाम *'}</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Event Type' : 'प्रकार'}</label>
                  <input type="text" value={formData.event_type} onChange={(e) => setFormData({...formData, event_type: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., Wedding" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Event Date' : 'दिनांक'}</label>
                  <input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Customer ID' : 'ग्राहक ID'}</label>
                  <input type="text" value={formData.customer_id} onChange={(e) => setFormData({...formData, customer_id: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Customer Name' : 'ग्राहक नाम'}</label>
                  <input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Venue' : 'स्थान'}</label>
                  <input type="text" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Total Amount (₹)' : 'कुल राशि'}</label>
                  <input type="number" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Status' : 'स्थिति'}</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border rounded-md">
                  <option value="planned">Planned</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
