'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useTanStackQuery } from '@/hooks/use-query'
import { getPricing, deletePricing } from '@/lib/actions/events'
import { Edit, Trash2, Package } from 'lucide-react'

export function PricingList() {
  const { t, language } = useLanguage()
  const { data: rates, isLoading, refetch } = useTanStackQuery(['pricing-list'], () => getPricing())

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rate?')) return
    try { await deletePricing(id); refetch() }
    catch (error) { console.error('Error deleting:', error) }
  }

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i}><CardContent className="p-6"><div className="h-12 bg-muted rounded animate-pulse" /></CardContent></Card>)}</div>
  }

  return (
    <div className="space-y-4">
      {(rates ?? []).map((rate: any) => (
        <Card key={rate.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-semibold">{rate.inventory_item || 'Unknown Item'}</h4>
                  <p className="text-sm text-muted-foreground">{rate.rental_type} · {rate.inventory_item_id ? `Item ID: ${rate.inventory_item_id.slice(0,8)}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{formatCurrency(rate.rate, language)}/{rate.rental_type}</span>
                <button className="p-1.5 hover:bg-muted rounded" title={t('common.edit')}><Edit className="h-4 w-4" /></button>
                <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" title={t('common.delete')} onClick={() => handleDelete(rate.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {(rate.security_deposit || rate.min_rental_days) && (
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                {rate.security_deposit && <span>Deposit: {formatCurrency(rate.security_deposit, language)}</span>}
                {rate.min_rental_days && <span>Min days: {rate.min_rental_days}</span>}
                {rate.max_rental_days && <span>Max days: {rate.max_rental_days}</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {(rates ?? []).length === 0 && (
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No pricing rates configured yet</p></CardContent></Card>
      )}
    </div>
  )
}
