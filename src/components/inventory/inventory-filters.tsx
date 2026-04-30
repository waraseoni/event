'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function InventoryFilters() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const { t, language } = useLanguage()

  const categories = [
    { value: '', label: language === 'en' ? 'All Categories' : 'सभी कैटेगरी' },
    { value: 'LED Wall', label: 'LED Wall' },
    { value: 'Sound System', label: 'Sound System' },
    { value: 'Stage', label: 'Stage' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Lighting', label: 'Lighting' },
    { value: 'Decoration', label: 'Decoration' },
    { value: 'Tent', label: 'Tent' },
    { value: 'Catering Equipment', label: 'Catering Equipment' },
    { value: 'Other', label: 'Other' },
  ]

  const statuses = [
    { value: '', label: language === 'en' ? 'All Status' : 'सभी स्थिति' },
    { value: 'available', label: language === 'en' ? 'Available' : 'उपलब्ध' },
    { value: 'rented', label: language === 'en' ? 'Rented' : 'किराये पर' },
    { value: 'maintenance', label: language === 'en' ? 'Maintenance' : 'मरम्मत में' },
    { value: 'retired', label: language === 'en' ? 'Retired' : 'सेवानिवृत्त' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('inventory.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
