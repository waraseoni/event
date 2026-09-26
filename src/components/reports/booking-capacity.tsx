'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { useLanguage } from '@/contexts/language-context'
import { AlertTriangle } from 'lucide-react'

export function BookingCapacity() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: items, error: iErr } = await supabase.from('inventory_items').select('*')
      const { data: events, error: eErr } = await supabase.from('events').select('*').gte('status', 'planned').lte('status', 'in_progress')
      if (iErr && eErr) throw iErr
      const invItems = items || []
      const evts = events || []
      const capacityData = invItems.map((item: any) => {
        const conflictingEvents = evts.filter((e: any) => {
          if (!e.event_date) return false
          const eventDate = new Date(e.event_date)
          const today = new Date()
          return eventDate >= today
        })
        return {
          name: item.name.length > 15 ? item.name.slice(0, 15) + '…' : item.name,
          total: item.total_quantity || 0,
          available: item.available_quantity || 0,
          booked: (item.total_quantity || 0) - (item.available_quantity || 0),
          hasConflicts: conflictingEvents.length > 0,
        }
      })
      setData(capacityData)
    } catch (error) {
      console.error('Error fetching capacity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-64 bg-muted rounded animate-pulse" /></CardContent></Card>
  }

  const lowStock = data.filter((d: any) => (d.available || 0) <= 2)

  return (
    <Card>
      <CardHeader><CardTitle>{language === 'en' ? 'Booking Capacity' : 'बुकिंग क्षमता'}</CardTitle></CardHeader>
      <CardContent>
        {lowStock.length > 0 && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
            <AlertTriangle className="h-4 w-4" />
            {lowStock.length} item(s) low stock
          </div>
        )}
        {data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Avail: {item.available}</span>
                  <span className={item.hasConflicts ? 'text-red-600 font-bold' : 'text-green-600'}>
                    {item.hasConflicts ? '⚠' : '✓'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-muted-foreground text-center py-8">No items to track</p>}
      </CardContent>
    </Card>
  )
}
