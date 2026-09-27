'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import { useToast } from '@/components/ui/toast'
import { createEvent } from '@/lib/actions/events'
import { getClients } from '@/lib/actions/contacts'
import type { Contact, EventStatus } from '@/types'

const EVENT_STATUSES: EventStatus[] = [
  'planned',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]

const EMPTY = {
  name: '',
  event_type: '',
  customer_id: '',
  event_date: '',
  venue_address: '',
  status: 'planned' as EventStatus,
  total_amount: '',
  notes: '',
}

export function AddEventButton() {
  const { t, language } = useLanguage()
  const { success, error: showError } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(EMPTY)
  const [customers, setCustomers] = useState<Contact[]>([])

  useEffect(() => {
    if (!isOpen) return
    let active = true
    ;(async () => {
      try {
        const data = await getClients()
        if (active) setCustomers(data.filter((c: any) => c.type === 'customer'))
      } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.customer_id) {
      setError(language === 'en' ? 'Please choose a customer' : 'कृपया ग्राहक चुनें')
      return
    }
    if (!formData.event_date) {
      setError(language === 'en' ? 'Please choose an event date' : 'कृपया दिनांक चुनें')
      return
    }
    setLoading(true)
    try {
      const { error: insertError } = await createEvent({
        name: formData.name,
        customer_id: formData.customer_id,
        event_type: formData.event_type,
        start_datetime: formData.event_date,
        venue_address: formData.venue_address || null,
        status: formData.status,
      })
      if (insertError) throw insertError
      success('Event created'); setIsOpen(false)
      setFormData(EMPTY)
      window.location.reload()
    } catch (err) {
      // the old code swallowed this and always said "Error adding event", which
      // hid the real reason (constraint violation, RLS denial, ...)
      setError(err instanceof Error ? err.message : String(err))
      showError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {language === 'en' ? 'New Event' : 'नया ईवेंट'}
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {language === 'en' ? 'Add Event' : 'ईवेंट जोड़ें'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Event Name *' : 'ईवेंट नाम *'}
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Event Type' : 'प्रकार'}
                  </label>
                  <input
                    type="text"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Wedding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Event Date *' : 'दिनांक *'}
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Customer *' : 'ग्राहक *'}
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">
                    {language === 'en' ? 'Select a customer' : 'ग्राहक चुनें'}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company_name ? ` (${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'en'
                      ? 'No customers found. Add one from Contacts first.'
                      : 'कोई ग्राहक नहीं मिला। पहले Contacts में जोड़ें।'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Venue' : 'स्थान'}
                  </label>
                  <input
                    type="text"
                    value={formData.venue_address}
                    onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Total Amount' : 'कुल राशि'}
                  </label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Status' : 'स्थिति'}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EventStatus })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Notes' : 'नोट्स'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive break-words">{error}</p>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
