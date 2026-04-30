'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { getContactTypeLabel } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

export function ContactsFilter() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const { t, language } = useLanguage()

  const contactTypes = [
    { value: '', label: language === 'en' ? 'All Types' : 'सभी प्रकार' },
    { value: 'vendor', label: getContactTypeLabel('vendor') },
    { value: 'renter', label: getContactTypeLabel('renter') },
    { value: 'customer', label: getContactTypeLabel('customer') },
    { value: 'worker', label: getContactTypeLabel('worker') },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('contacts.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white"
      >
        {contactTypes.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
