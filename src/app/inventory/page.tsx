'use client'

import { InventoryList } from '@/components/inventory/inventory-list'
import { InventoryStats } from '@/components/inventory/inventory-stats'
import { AddItemButton } from '@/components/inventory/add-item-button'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { useLanguage } from '@/contexts/language-context'

export default function InventoryPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.inventory.title')}</h1>
          <p className="text-muted-foreground">
            {t('page.inventory.description')}
          </p>
        </div>
        <AddItemButton />
      </div>
      
      <InventoryStats />
      <InventoryFilters />
      <InventoryList />
    </div>
  )
}
