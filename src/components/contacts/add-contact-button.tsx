'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getContactTypeLabel } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'

export function AddContactButton() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    phone: '',
    email: '',
    address: '',
    company_name: '',
    gst_number: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('contacts').insert([formData])

      if (error) throw error

      setIsOpen(false)
      setFormData({
        name: '',
        type: 'customer',
        phone: '',
        email: '',
        address: '',
        company_name: '',
        gst_number: '',
        notes: '',
      })
      window.location.reload()
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Error adding contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {language === 'en' ? 'New Contact' : 'नया संपर्क'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add New Contact' : 'नया संपर्क जोड़ें'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Name *' : 'नाम *'}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Type *' : 'प्रकार *'}</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="vendor">{getContactTypeLabel('vendor')}</option>
                  <option value="renter">{getContactTypeLabel('renter')}</option>
                  <option value="customer">{getContactTypeLabel('customer')}</option>
                  <option value="worker">{getContactTypeLabel('worker')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Phone *' : 'फोन *'}</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">पता</label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">कंपनी का नाम</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GST नंबर</label>
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) =>
                    setFormData({ ...formData, gst_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">नोट्स</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

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
