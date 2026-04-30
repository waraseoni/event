'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PricingStats() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">कुल मूल्य निर्धारण</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-</div>
        </CardContent>
      </Card>
    </div>
  )
}
