'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EventsStats() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">कुल ईवेंट्स</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
        </CardContent>
      </Card>
    </div>
  )
}
