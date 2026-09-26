'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { generateUniqueCode } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

export function AddItemButton() {
  const { t, language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    serial_number: '',
    unique_code: generateUniqueCode('ITM'),
    company: '',
    model: '',
    scope: '',
    item_type: 'owned' as const,
    target_event_types: '',
    estimated_rent_price: '',
    min_price: '',
    security_deposit: '',
    reorder_level: 1,
    total_quantity: 1,
    unit: 'piece',
    purchase_price: '',
    condition: 'good' as const,
    location: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await (supabase.from('inventory_items').insert as any)([
        {
          ...formData,
          available_quantity: formData.total_quantity,
          purchase_price: formData.purchase_price
            ? parseFloat(formData.purchase_price)
            : null,
          estimated_rent_price: formData.estimated_rent_price
            ? parseFloat(formData.estimated_rent_price)
            : null,
          min_price: formData.min_price
            ? parseFloat(formData.min_price)
            : null,
          security_deposit: formData.security_deposit
            ? parseFloat(formData.security_deposit)
            : null,
          reorder_level: formData.reorder_level || 1,
          target_event_types: formData.target_event_types || null,
        },
      ])

      if (error) throw error

      setIsOpen(false)
      setFormData({
        name: '',
        category: '',
        description: '',
        serial_number: '',
        unique_code: generateUniqueCode('ITM'),
        company: '',
        model: '',
        scope: '',
        item_type: 'owned',
        target_event_types: '',
        estimated_rent_price: '',
        min_price: '',
        security_deposit: '',
        reorder_level: 1,
        total_quantity: 1,
        unit: 'piece',
        purchase_price: '',
        condition: 'good',
        location: '',
      })
      window.location.reload()
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Error adding item')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    'LED Wall',
    'Sound System',
    'Stage',
    'Furniture',
    'Lighting',
    'Decoration',
    'Tent',
    'Catering Equipment',
    'Other',
  ]

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {language === 'en' ? 'New Item' : 'नया सामान'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{language === 'en' ? 'Add New Item' : 'नया सामान जोड़ें'}</h2>

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
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Company' : 'कंपनी'}
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Martin, Chauvet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Model' : 'मॉडल'}
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., MAC 2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Scope' : 'स्कोप'}
                  </label>
                  <select
                    value={formData.scope}
                    onChange={(e) =>
                      setFormData({ ...formData, scope: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="local">Local</option>
                    <option value="national">National</option>
                    <option value="international">International</option>
                    <option value="both">Both Local & International</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Item Type' : 'सामान प्रकार'}
                  </label>
                  <select
                    value={formData.item_type}
                    onChange={(e) =>
                      setFormData({ ...formData, item_type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="owned">Owned</option>
                    <option value="external">External Rental</option>
                    <option value="both">Owned & External</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Target Event Types' : 'लक्ष्य इवेंट प्रकार'}
                  </label>
                  <input
                    type="text"
                    value={formData.target_event_types}
                    onChange={(e) =>
                      setFormData({ ...formData, target_event_types: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Wedding, Corporate, Festival"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Est. Rent Price (₹/day)' : 'अनुमानित किराया (₹/दिन)'}
                  </label>
                  <input
                    type="number"
                    value={formData.estimated_rent_price}
                    onChange={(e) =>
                      setFormData({ ...formData, estimated_rent_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Min Rental Price (₹)' : 'न्यूनतम किराया (₹)'}
                  </label>
                  <input
                    type="number"
                    value={formData.min_price}
                    onChange={(e) =>
                      setFormData({ ...formData, min_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Security Deposit (₹)' : 'सुरक्षा जमा (₹)'}
                  </label>
                  <input
                    type="number"
                    value={formData.security_deposit}
                    onChange={(e) =>
                      setFormData({ ...formData, security_deposit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Reorder Level' : 'पुनः ऑर्डर स्तर'}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'en' ? 'Quantity *' : 'मात्रा *'}
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.total_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_quantity: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Unique Code (Auto-generated)
                </label>
                <input
                  type="text"
                  value={formData.unique_code}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      condition: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_price: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
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
