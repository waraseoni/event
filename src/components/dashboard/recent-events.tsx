'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Event } from '@/types'
import { formatDate, getStatusColor, formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export function RecentEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentEvents()
  }, [])

  async function fetchRecentEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, customer:contacts(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching recent events:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>हाल के ईवेंट्स</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>हाल के ईवेंट्स</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-muted-foreground">कोई ईवेंट नहीं मिला</p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between space-x-4"
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {event.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.customer?.name || 'Unknown'} • {formatDate(event.event_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(event.total_amount)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <Link
            href="/events"
            className="text-sm text-primary hover:underline"
          >
            सभी ईवेंट्स देखें →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
