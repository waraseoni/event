'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InventoryItem } from '@/types'
import { getStatusColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export function InventoryOverview() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    rentedItems: 0,
    maintenanceItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventoryOverview()
  }, [])

  async function fetchInventoryOverview() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('available_quantity', { ascending: true })
        .limit(10)

      if (error) throw error

      setItems(data || [])

      // Calculate stats
      const { data: allItems } = await supabase
        .from('inventory_items')
        .select('status, total_quantity')

      const stats = {
        totalItems: allItems?.reduce((sum, item) => sum + item.total_quantity, 0) || 0,
        availableItems: allItems
          ?.filter((item) => item.status === 'available')
          .reduce((sum, item) => sum + item.total_quantity, 0) || 0,
        rentedItems: allItems
          ?.filter((item) => item.status === 'rented')
          .reduce((sum, item) => sum + item.total_quantity, 0) || 0,
        maintenanceItems: allItems
          ?.filter((item) => item.status === 'maintenance')
          .reduce((sum, item) => sum + item.total_quantity, 0) || 0,
      }

      setStats(stats)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>इन्वेंटरी अवलोकन</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const lowStockItems = items.filter(
    (item) => item.available_quantity <= 2 && item.status === 'available'
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>इन्वेंटरी अवलोकन</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">कुल सामान</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">उपलब्ध</p>
            <p className="text-2xl font-bold text-green-600">{stats.availableItems}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">किराये पर</p>
            <p className="text-2xl font-bold text-blue-600">{stats.rentedItems}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">मरम्मत में</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.maintenanceItems}</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-red-600">
              कम स्टॉक वाले आइटम:
            </h4>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-red-50 rounded"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600">
                    केवल {item.available_quantity} उपलब्ध
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/inventory"
          className="text-sm text-primary hover:underline"
        >
          पूरी इन्वेंटरी देखें →
        </Link>
      </CardContent>
    </Card>
  )
}
