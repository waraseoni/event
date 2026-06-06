'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Event } from '@/types'
import { formatDate, calculateDaysBetween } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export function UpcomingBookings() {
  const { t, language } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingBookings()
  }, [])

  async function fetchUpcomingBookings() {
    try {
      const today = new Date().toISOString()

      const { data, error } = await supabase
        .from('events')
        .select('*, customer:contacts(name)')
        .gte('event_date', today)
        .in('status', ['confirmed', 'planned'])
        .order('event_date', { ascending: true })
        .limit(5)

      if (error) throw error

      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDaysUntilEvent(eventDate: string): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const event = new Date(eventDate)
    event.setHours(0, 0, 0, 0)

    const days = calculateDaysBetween(today.toISOString(), event.toISOString()) - 1

    if (days === 0) return language === 'en' ? 'Today' : 'आज'
    if (days === 1) return language === 'en' ? 'Tomorrow' : 'कल'
    if (days < 0) return language === 'en' ? 'Past' : 'पिछला'
    return language === 'en' ? `${days} days later` : `${days} दिन बाद`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.upcomingBookings')}</CardTitle>
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
        <CardTitle>{t('dashboard.upcomingBookings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-muted-foreground">{t('events.noEvents')}</p>
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
                    {event.customer?.name || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {getDaysUntilEvent(event.event_date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.event_date, language)}
                  </p>
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
            {t('dashboard.viewAll')} →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
