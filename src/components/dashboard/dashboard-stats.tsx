'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Package, IndianRupee, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'

export function DashboardStats() {
  const { t } = useLanguage()
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeRentals: 0,
    monthlyRevenue: 0,
    netProfit: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  async function fetchDashboardStats() {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Get total events
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // Get active rentals (reserved or picked_up status)
      const { count: activeRentals } = await supabase
        .from('event_items')
        .select('*', { count: 'exact', head: true })
        .in('status', ['reserved', 'picked_up'])

      // Get monthly revenue from payments
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount, type')
        .gte('payment_date', `${currentMonth}-01`)

      let monthlyRevenue = 0
      let monthlyExpenses = 0

      monthlyPayments?.forEach((payment) => {
        if (payment.type === 'incoming') {
          monthlyRevenue += payment.amount
        } else {
          monthlyExpenses += payment.amount
        }
      })

      const netProfit = monthlyRevenue - monthlyExpenses

      setStats({
        totalEvents: totalEvents || 0,
        activeRentals: activeRentals || 0,
        monthlyRevenue,
        netProfit,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('common.loading')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const items = [
    {
      title: t('dashboard.totalEvents'),
      value: stats.totalEvents,
      icon: CalendarDays,
      color: 'text-blue-600',
    },
    {
      title: t('dashboard.activeRentals'),
      value: stats.activeRentals,
      icon: Package,
      color: 'text-orange-600',
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: formatCurrency(stats.monthlyRevenue),
      icon: IndianRupee,
      color: 'text-green-600',
    },
    {
      title: t('dashboard.netProfit'),
      value: formatCurrency(stats.netProfit),
      icon: TrendingUp,
      color: stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
