'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { Edit, Trash2, CalendarDays } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function EventsList() {
  const { t, language } = useLanguage()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchEvents() {
    try {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: false })
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      fetchEvents()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><div className="h-12 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
  }

  return (
    <div className="space-y-4">
      {events.map((ev) => (
        <Card key={ev.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-semibold">{ev.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ev.event_type} · {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-800'}`}>
                  {ev.status}
                </span>
                <button className="p-1.5 hover:bg-muted rounded"><Edit className="h-4 w-4" /></button>
                <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" onClick={() => handleDelete(ev.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {(ev.customer_name || ev.total_amount) && (
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                {ev.customer_name && <span>Customer: {ev.customer_name}</span>}
                {ev.total_amount && <span className="font-medium">{formatCurrency(ev.total_amount, language)}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {events.length === 0 && (
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No events scheduled yet</p></CardContent></Card>
      )}
    </div>
  )
}
