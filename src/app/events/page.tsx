'use client'

import { EventsList } from '@/components/events/events-list'
import { EventsStats } from '@/components/events/events-stats'
import { AddEventButton } from '@/components/events/add-event-button'
import { EventsFilter } from '@/components/events/events-filter'
import { useLanguage } from '@/contexts/language-context'
import { CalendarDays } from 'lucide-react'

export default function EventsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <CalendarDays className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Event Bookings' : 'इवेंट बुकिंग्स'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Schedule, organize, and manage your upcoming events' : 'अपने आगामी इवेंट्स को शेड्यूल और व्यवस्थित करें'}
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <AddEventButton />
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>
      
      <EventsStats />
      <EventsFilter />
      <EventsList />
    </div>
  )
}
