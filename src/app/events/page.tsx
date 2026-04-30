'use client'

import { EventsList } from '@/components/events/events-list'
import { EventsStats } from '@/components/events/events-stats'
import { AddEventButton } from '@/components/events/add-event-button'
import { EventsFilter } from '@/components/events/events-filter'
import { useLanguage } from '@/contexts/language-context'

export default function EventsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.events.title')}</h1>
          <p className="text-muted-foreground">
            {t('page.events.description')}
          </p>
        </div>
        <AddEventButton />
      </div>
      
      <EventsStats />
      <EventsFilter />
      <EventsList />
    </div>
  )
}
