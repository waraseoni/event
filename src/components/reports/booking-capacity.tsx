'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function BookingCapacity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>बुकिंग क्षमता कैलकुलेटर</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          भविष्य में कितने ईवेंट्स बुक किए जा सकते हैं - Coming soon
        </p>
      </CardContent>
    </Card>
  )
}
