'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InventoryItem } from '@/types'
import { getStatusColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/contexts/language-context'

export function InventoryOverview() {
  const { t } = useLanguage()
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

      const itemsList = allItems as any[]
      const stats = {
        totalItems: itemsList?.reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0,
        availableItems: itemsList
          ?.filter((item) => item.status === 'available')
          .reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0,
        rentedItems: itemsList
          ?.filter((item) => item.status === 'rented')
          .reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0,
        maintenanceItems: itemsList
          ?.filter((item) => item.status === 'maintenance')
          .reduce((sum, item) => sum + (item.total_quantity || 0), 0) || 0,
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
          <CardTitle>{t('dashboard.inventoryOverview')}</CardTitle>
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
        <CardTitle>{t('dashboard.inventoryOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('inventory.totalItems')}</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('inventory.available')}</p>
            <p className="text-2xl font-bold text-green-600">{stats.availableItems}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('inventory.rented')}</p>
            <p className="text-2xl font-bold text-blue-600">{stats.rentedItems}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">{t('inventory.maintenance')}</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.maintenanceItems}</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-red-600">
              {t('inventory.lowStockItems')}
            </h4>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-red-50 rounded"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-red-600">
                    {t('inventory.onlyAvailable').replace('{count}', item.available_quantity.toString())}
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
          {t('dashboard.viewAll')} →
        </Link>
      </CardContent>
    </Card>
  )
}
