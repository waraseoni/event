'use client'

import { PricingList } from '@/components/pricing/pricing-list'
import { PricingStats } from '@/components/pricing/pricing-stats'
import { AddPricingButton } from '@/components/pricing/add-pricing-button'
import { useLanguage } from '@/contexts/language-context'
import { IndianRupee } from 'lucide-react'

export default function PricingPage() {
  const { t, language } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <IndianRupee className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Rate Cards & Pricing' : 'रेट कार्ड और मूल्य निर्धारण'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Configure standardized packages and custom rate cards' : 'मानकीकृत पैकेज और कस्टम रेट कार्ड कॉन्फ़िगर करें'}
              </p>
            </div>
          </div>
          
          <div className="flex shrink-0">
            <AddPricingButton />
          </div>
        </div>
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 dark:bg-slate-900 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </div>
      
      <PricingStats />
      <PricingList />
    </div>
  )
}
