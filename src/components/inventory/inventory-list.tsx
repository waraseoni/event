'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { InventoryItem } from '@/types'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Edit, Trash2, Package, AlertCircle } from 'lucide-react'

export function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')

      if (error) throw error

      setItems(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">कोई सामान नहीं मिला</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({item.unique_code})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Category: {item.category}
                    </span>
                    <span className="text-muted-foreground">
                      Unit: {item.unit}
                    </span>
                    {item.serial_number && (
                      <span className="text-muted-foreground">
                        S/N: {item.serial_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Condition: {item.condition}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mt-2">
                    <span className="font-medium">
                      Total: {item.total_quantity}
                    </span>
                    <span className="text-green-600 font-medium">
                      Available: {item.available_quantity}
                    </span>
                    <span className="text-blue-600 font-medium">
                      Rented: {item.total_quantity - item.available_quantity}
                    </span>
                  </div>

                  {item.purchase_price && (
                    <p className="text-sm text-muted-foreground">
                      Purchase Price: {formatCurrency(item.purchase_price)}
                    </p>
                  )}

                  {item.location && (
                    <p className="text-sm text-muted-foreground">
                      Location: {item.location}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  )}

                  {item.available_quantity <= 2 && item.status === 'available' && (
                    <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                      <AlertCircle className="h-4 w-4" />
                      Low stock warning
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-muted rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-red-50 text-red-600 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
