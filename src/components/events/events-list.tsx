'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useTanStackQuery } from '@/hooks/use-query'
import { getEvents, deleteEvent } from '@/lib/actions/events'
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
  const { data: events, isLoading, refetch } = useTanStackQuery(['events-list'], () => getEvents())

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try { await deleteEvent(id); refetch() }
    catch (error) { console.error('Error deleting:', error) }
  }

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      {(events ?? []).map((ev: any) => (
        <Card key={ev.id} className="border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{ev.name}</h3>
                <p className="text-xs text-muted-foreground">{ev.event_date} · {ev.event_type}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-800'}`}>{ev.status}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="p-1.5 hover:bg-muted rounded"><Edit className="h-4 w-4" /></button>
              <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" onClick={() => handleDelete(ev.id)}><Trash2 className="h-4 w-4" /></button>
            </div>
            {(ev.venue_address || ev.total_amount) && (
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                {ev.venue_address && <span>Venue: {ev.venue_address}</span>}
                {ev.total_amount && <span className="font-medium">{formatCurrency(ev.total_amount, language)}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {(events ?? []).length === 0 && (
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No events scheduled yet</p></CardContent></Card>
      )}
    </div>
  )
}
