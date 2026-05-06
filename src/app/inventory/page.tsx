'use client'

import { InventoryList } from '@/components/inventory/inventory-list'
import { InventoryStats } from '@/components/inventory/inventory-stats'
import { AddItemButton } from '@/components/inventory/add-item-button'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { useLanguage } from '@/contexts/language-context'
import { Package } from 'lucide-react'

export default function InventoryPage() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Package className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Assets & Inventory' : 'एसेट्स और इन्वेंटरी'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Track your equipment, products, and physical assets' : 'अपने उपकरण, उत्पाद और भौतिक संपत्तियों को ट्रैक करें'}
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <AddItemButton />
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>
      
      <InventoryStats />
      <InventoryFilters />
      <InventoryList />
    </div>
  )
}
