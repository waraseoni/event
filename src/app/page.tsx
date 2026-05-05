'use client'

import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentEvents } from '@/components/dashboard/recent-events'
import { InventoryOverview } from '@/components/dashboard/inventory-overview'
import { UpcomingBookings } from '@/components/dashboard/upcoming-bookings'
import { useLanguage } from '@/contexts/language-context'
import { Sparkles, Zap, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-8">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyem0tNiA2aC00djJoNHYtMnptMC02di00aC00djRoNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="h-6 w-6 text-yellow-300" />
            </div>
            <span className="px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              ✨ Events Management System
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white via-yellow-200 to-pink-200 bg-clip-text text-transparent">
            {t('nav.dashboard')}
          </h1>
          <p className="text-lg text-white/80 max-w-xl">
            {t('language.hindi') === 'हिंदी' 
              ? 'Complete Solution - Manage your events with style and efficiency'
              : 'संपूर्ण समाधान - अपने कार्यक्रमों को शैली और दक्षता के साथ प्रबंधित करें'}
          </p>
        </div>
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl float"></div>
        <div className="absolute bottom-4 right-20 w-16 h-16 bg-pink-400/30 rounded-full blur-xl float" style={{ animationDelay: '1s' }}></div>
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
