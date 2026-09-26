'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

export function InventoryUtilization() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data, error } = await supabase.from('inventory_items').select('*')
      if (error) throw error
      const items = data || []
      const chartData = items.map((item: any) => ({
        name: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
        available: item.available_quantity || 0,
        total: item.total_quantity || 0,
        rented: (item.total_quantity || 0) - (item.available_quantity || 0),
      }))
      setData(chartData)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-64 bg-muted rounded animate-pulse" /></CardContent></Card>
  }

  const totalQty = data.reduce((s: number, d: any) => s + d.total, 0)
  const rentedQty = data.reduce((s: number, d: any) => s + d.rented, 0)
  const utilization = totalQty > 0 ? ((rentedQty / totalQty) * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader><CardTitle>{language === 'en' ? 'Inventory Utilization' : 'इन्वेंटरी उपयोग'}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{utilization}% {language === 'en' ? 'Utilized' : 'उपयोग'}</div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="available" fill="#10b981" name="Available" />
              <Bar dataKey="rented" fill="#f59e0b" name="Rented" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-muted-foreground text-center py-8">No inventory data</p>}
      </CardContent>
    </Card>
  )
}
