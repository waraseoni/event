'use client'

import { ProfitLossReport } from '@/components/reports/profit-loss-report'
import { InventoryUtilization } from '@/components/reports/inventory-utilization'
import { ContactAnalytics } from '@/components/reports/contact-analytics'
import { BookingCapacity } from '@/components/reports/booking-capacity'
import { useLanguage } from '@/contexts/language-context'
import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <BarChart3 className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Analytics & Insights' : 'एनालिटिक्स और इनसाइट्स'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'View financial performance, inventory usage, and key metrics' : 'वित्तीय प्रदर्शन, इन्वेंटरी उपयोग और प्रमुख मेट्रिक्स देखें'}
              </p>
            </div>
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
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
