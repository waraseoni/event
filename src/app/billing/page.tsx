'use client'

import { useState } from 'react'
import { useTanStackQuery } from '@/hooks/use-query'
import { useLanguage } from '@/contexts/language-context'
import { getInvoices } from '@/lib/actions/contacts'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Receipt } from 'lucide-react'

export default function BillingPage() {
  const { t, language } = useLanguage()
  const { data: invoices, isLoading } = useTanStackQuery(['invoices'], () => getInvoices())

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#000000] p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-slate-900 dark:bg-white rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <Receipt className="h-7 w-7 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Invoices & Billing' : 'चलान और बिलिंग'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {language === 'en' ? 'Manage invoices and payments' : 'चलान और भुगतान प्रबंधित करें'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Total Invoices' : 'कुल चलान'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{(invoices ?? []).length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Total Amount' : 'कुल राशि'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency((invoices ?? []).reduce((s: number, i: any) => s + (Number(i.grand_total) || 0), 0), language)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{language === 'en' ? 'Amount Due' : 'बकाया'}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{formatCurrency((invoices ?? []).reduce((s: number, i: any) => s + (Number(i.amount_due) || 0), 0), language)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : (
            <div className="space-y-4">
              {(invoices ?? []).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-semibold">{inv.invoice_no}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inv.issue_date).toLocaleDateString()} · {formatCurrency(inv.grand_total, language)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    inv.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              ))}
              {(invoices ?? []).length === 0 && <p className="text-muted-foreground text-center py-8">No invoices yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
