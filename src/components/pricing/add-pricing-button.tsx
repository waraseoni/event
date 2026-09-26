'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'

export function AddPricingButton() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    inventory_item_id: '',
    rental_type: 'daily',
    rate: '',
    security_deposit: '',
    min_rental_days: '',
    max_rental_days: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('pricing_rates').insert([{
        inventory_item_id: formData.inventory_item_id || null,
        rental_type: formData.rental_type,
        rate: parseFloat(formData.rate) || 0,
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        min_rental_days: formData.min_rental_days ? parseInt(formData.min_rental_days) : null,
        max_rental_days: formData.max_rental_days ? parseInt(formData.max_rental_days) : null,
      }])
      if (error) throw error
      setIsOpen(false)
      setFormData({ inventory_item_id: '', rental_type: 'daily', rate: '', security_deposit: '', min_rental_days: '', max_rental_days: '' })
      window.location.reload()
    } catch {
      alert('Error adding pricing rate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}><Plus className="h-4 w-4 mr-2" />{language === 'en' ? 'New Rate' : 'नया मूल्य'}</Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add Pricing Rate' : 'मूल्य दर जोड़ें'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Inventory Item ID' : 'इन्वेंटरी आइटम ID'}</label>
                <input type="text" value={formData.inventory_item_id} onChange={(e) => setFormData({...formData, inventory_item_id: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., a1b2c3d4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Rental Type' : 'किराया प्रकार'}</label>
                <select value={formData.rental_type} onChange={(e) => setFormData({...formData, rental_type: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="per_event">Per Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Rate *' : 'दर *'}</label>
                <input required type="number" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Security Deposit' : 'सुरक्षा जमा'}</label>
                <input type="number" value={formData.security_deposit} onChange={(e) => setFormData({...formData, security_deposit: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Min Days' : 'न्यूनतम दिन'}</label>
                  <input type="number" value={formData.min_rental_days} onChange={(e) => setFormData({...formData, min_rental_days: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{language === 'en' ? 'Max Days' : 'अधिकतम दिन'}</label>
                  <input type="number" value={formData.max_rental_days} onChange={(e) => setFormData({...formData, max_rental_days: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
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
