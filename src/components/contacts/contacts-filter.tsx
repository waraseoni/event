'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
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
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder={t('contacts.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                     text-sm placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* Type Filter */}
      <div className="relative">
        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 sm:hidden" />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full sm:w-auto pl-10 sm:pl-4 pr-10 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 
                     rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                     text-sm text-slate-700 appearance-none cursor-pointer transition-all"
        >
          {contactTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
