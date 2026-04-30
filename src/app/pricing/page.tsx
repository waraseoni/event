'use client'

import { PricingList } from '@/components/pricing/pricing-list'
import { PricingStats } from '@/components/pricing/pricing-stats'
import { AddPricingButton } from '@/components/pricing/add-pricing-button'
import { useLanguage } from '@/contexts/language-context'

export default function PricingPage() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('page.pricing.title')}</h1>
          <p className="text-muted-foreground">
            {t('page.pricing.description')}
          </p>
        </div>
        <AddPricingButton />
      </div>
      
      <PricingStats />
      <PricingList />
    </div>
  )
}
