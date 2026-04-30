'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/language-context'

export function InventoryStats() {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    availableQuantity: 0,
    rentedQuantity: 0,
    maintenanceQuantity: 0,
    lowStockItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('total_quantity, available_quantity, status')

      if (error) throw error

      const items = data || []
      const totalItems = items.length
      const totalQuantity = items.reduce((sum, item) => sum + item.total_quantity, 0)
      const availableQuantity = items.reduce((sum, item) => sum + item.available_quantity, 0)
      const rentedQuantity = totalQuantity - availableQuantity
      const maintenanceQuantity = items
        .filter((item) => item.status === 'maintenance')
        .reduce((sum, item) => sum + item.total_quantity, 0)
      const lowStockItems = items.filter(
        (item) => item.available_quantity <= 2 && item.status === 'available'
      ).length

      setStats({
        totalItems,
        totalQuantity,
        availableQuantity,
        rentedQuantity,
        maintenanceQuantity,
        lowStockItems,
      })
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const items = [
    {
      title: language === 'en' ? 'Total Items' : 'कुल आइटम्स',
      value: stats.totalItems,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: language === 'en' ? 'Available' : 'उपलब्ध',
      value: stats.availableQuantity,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: language === 'en' ? 'Rented' : 'किराये पर',
      value: stats.rentedQuantity,
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: language === 'en' ? 'Low Stock' : 'कम स्टॉक',
      value: stats.lowStockItems,
      icon: AlertCircle,
      color: 'text-red-600',
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
