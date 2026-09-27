'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import type { InventoryItem, RentalType } from '@/types'

const RENTAL_TYPES: RentalType[] = ['daily', 'weekly', 'monthly', 'per_event']

const EMPTY = {
  inventory_item_id: '',
  rental_type: 'daily' as RentalType,
  rate: '',
  security_deposit: '',
  min_rental_days: '',
  max_rental_days: '',
}

export function AddPricingButton() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState(EMPTY)
  const [items, setItems] = useState<InventoryItem[]>([])

  // inventory_item_id is NOT NULL with an FK to inventory_items. The old form
  // asked for a raw UUID, so a rate could only be added by guessing one.
  useEffect(() => {
    if (!isOpen) return
    let active = true
    ;(async () => {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')
      if (active && data) setItems(data)
    })()
    return () => {
      active = false
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.inventory_item_id) {
      setError(language === 'en' ? 'Please choose an item' : 'कृपया आइटम चुनें')
      return
    }
    setLoading(true)
    try {
      const { error: insertError } = await supabase.from('pricing_rates').insert({
        inventory_item_id: formData.inventory_item_id,
        rental_type: formData.rental_type,
        rate: parseFloat(formData.rate) || 0,
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        min_rental_days: formData.min_rental_days ? parseInt(formData.min_rental_days) : null,
        max_rental_days: formData.max_rental_days ? parseInt(formData.max_rental_days) : null,
      })
      if (insertError) throw insertError
      setIsOpen(false)
      setFormData(EMPTY)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {language === 'en' ? 'New Rate' : 'नया मूल्य'}
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {language === 'en' ? 'Add Pricing Rate' : 'मूल्य दर जोड़ें'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Inventory Item *' : 'इन्वेंटरी आइटम *'}
                </label>
                <select
                  required
                  value={formData.inventory_item_id}
                  onChange={(e) => setFormData({ ...formData, inventory_item_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">
                    {language === 'en' ? 'Select an item' : 'आइटम चुनें'}
                  </option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unique_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Rental Type' : 'किराया प्रकार'}
                </label>
                <select
                  value={formData.rental_type}
                  onChange={(e) =>
                    setFormData({ ...formData, rental_type: e.target.value as RentalType })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {RENTAL_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Rate *' : 'दर *'}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'en' ? 'Security Deposit' : 'सुरक्षा जमा'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Min Days' : 'न्यूनतम दिन'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_rental_days}
                    onChange={(e) => setFormData({ ...formData, min_rental_days: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Max Days' : 'अधिकतम दिन'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_rental_days}
                    onChange={(e) => setFormData({ ...formData, max_rental_days: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive break-words">{error}</p>}
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
