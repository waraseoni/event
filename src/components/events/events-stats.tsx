'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

export function EventsStats() {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, revenue: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { data, error } = await supabase.from('events').select('*')
      if (error) throw error
      const evts = data || []
      const today = new Date().toISOString().split('T')[0]
      setStats({
        total: evts.length,
        upcoming: evts.filter((e: any) => e.event_date && e.event_date >= today && e.status !== 'cancelled').length,
        completed: evts.filter((e: any) => e.status === 'completed').length,
        revenue: evts.reduce((s: number, e: any) => s + (Number(e.total_amount) || 0), 0),
      })
    } catch {
      // silent
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Total Events' : 'कुल ईवेंट्स'}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Upcoming' : 'आगामी'}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.upcoming}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Completed' : 'पूर्ण'}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completed}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Total Revenue' : 'कुल राजस्व'}</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.revenue, language)}</div></CardContent></Card>
    </div>
  )
}
