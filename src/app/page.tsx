'use client'

import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentEvents } from '@/components/dashboard/recent-events'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'
import { UpcomingBookings } from '@/components/dashboard/upcoming-bookings'
import { useLanguage } from '@/contexts/language-context'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground">
          Events Management System - {t('language.hindi') === 'हिंदी' ? 'Complete Solution' : 'संपूर्ण समाधान'}
        </p>
      </div>
      
      <DashboardStats />
      
      <div className="grid gap-6 md:grid-cols-2">
        <RecentEvents />
        <UpcomingBookings />
      </div>
      
      <InventoryOverview />
    </div>
  )
}
