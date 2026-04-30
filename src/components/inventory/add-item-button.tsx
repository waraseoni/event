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
      const { error } = await supabase.from('inventory_items').insert([
        {
          ...formData,
          available_quantity: formData.total_quantity,
          purchase_price: formData.purchase_price
            ? parseFloat(formData.purchase_price)
            : null,
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

                <div>
                  <label className="block text-sm font-medium mb-1">Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="piece">Piece</option>
                    <option value="set">Set</option>
                    <option value="pair">Pair</option>
                    <option value="meter">Meter</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                  </select>
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
