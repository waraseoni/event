'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function InventoryUtilization() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>इन्वेंटरी उपयोग</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Inventory utilization analysis coming soon</p>
      </CardContent>
    </Card>
  )
}
