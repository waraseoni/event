'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const TYPE_COLORS: Record<string, string> = {
  vendor: '#6366f1',
  renter: '#f59e0b',
  customer: '#10b981',
  worker: '#ef4444',
}

export function ContactAnalytics() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data, error } = await supabase.from('contacts').select('type')
      if (error) throw error
      const contacts = data || []
      const typeCounts: Record<string, number> = {}
      contacts.forEach((c: any) => { typeCounts[c.type] = (typeCounts[c.type] || 0) + 1 })
      const chartData = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value,
        color: TYPE_COLORS[name] || '#64748b',
      }))
      setData(chartData)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-64 bg-muted rounded animate-pulse" /></CardContent></Card>
  }

  const total = data.reduce((s: number, d: any) => s + d.value, 0)

  return (
    <Card>
      <CardHeader><CardTitle>{language === 'en' ? 'Contact Analytics' : 'संपर्क विश्लेषण'}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{total} {language === 'en' ? 'Total Contacts' : 'कुल संपर्क'}</div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {data.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : <p className="text-muted-foreground text-center py-8">No contact data</p>}
      </CardContent>
    </Card>
  )
}
