'use client'

import { ProfitLossReport } from '@/components/reports/profit-loss-report'
import { InventoryUtilization } from '@/components/reports/inventory-utilization'
import { ContactAnalytics } from '@/components/reports/contact-analytics'
import { BookingCapacity } from '@/components/reports/booking-capacity'
import { useLanguage } from '@/contexts/language-context'

export default function ReportsPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('page.reports.title')}</h1>
        <p className="text-muted-foreground">
          {t('page.reports.description')}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ProfitLossReport />
        <InventoryUtilization />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ContactAnalytics />
        <BookingCapacity />
      </div>
    </div>
  )
}
