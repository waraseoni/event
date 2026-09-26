'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'

export function PricingStats() {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({ total: 0, avgRate: 0, totalItems: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { data, error } = await supabase.from('pricing_rates').select('*')
      if (error) throw error
      const rates = data || []
      const totalItems = new Set(rates.map((r: any) => r.inventory_item_id)).size
      const avgRate = rates.length > 0 ? rates.reduce((s: number, r: any) => s + (Number(r.rate) || 0), 0) / rates.length : 0
      setStats({ total: rates.length, avgRate, totalItems })
    } catch {
      // silent
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Total Rates' : 'कुल दरें'}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Unique Items Priced' : 'प्राइस्ड आइटम'}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{stats.totalItems}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Avg Rate' : 'औसत दर'}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.avgRate, language)}</div></CardContent>
      </Card>
    </div>
  )
}
