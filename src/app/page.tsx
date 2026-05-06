'use client'

import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentEvents } from '@/components/dashboard/recent-events'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'
import { UpcomingBookings } from '@/components/dashboard/upcoming-bookings'
import { useLanguage } from '@/contexts/language-context'
import { useSystemSettings } from '@/contexts/system-settings-context'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const { t, language } = useLanguage()
  const { settings } = useSystemSettings()

  // Use system name from settings or fallback
  const systemName = settings?.system_name || 'Events Management System'
  const ownerName = settings?.owner_name || ''

  return (
    <div className="space-y-8">
      {/* Hero Section - Sleek & Professional */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-white dark:text-slate-900" />
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold tracking-wide border border-slate-200 dark:border-slate-800">
                {systemName}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white tracking-tight">
              {t('nav.dashboard')}
            </h1>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl">
              {language === 'en' 
                ? `Welcome to your command center${ownerName ? ` - Managed by ${ownerName}` : ''}. Here is what's happening.`
                : `डैशबोर्ड में आपका स्वागत है${ownerName ? ` - ${ownerName} द्वारा प्रबंधित` : ''}। यहाँ आपकी सभी गतिविधियाँ हैं।`}
            </p>
          </div>
        </div>
        
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
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
