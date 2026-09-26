'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#0f172a', '#64748b', '#f59e0b', '#10b981', '#ef4444']

export function ProfitLossReport() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    try {
      const { data: events, error: eErr } = await supabase.from('events').select('*')
      const { data: payments, error: pErr } = await supabase.from('payments').select('*')
      if (eErr && pErr) throw eErr
      const evts = events || []
      const pays = payments || []
      const income = pays.filter((p: any) => p.type === 'incoming')
      const expense = pays.filter((p: any) => p.type === 'outgoing')
      const monthly: Record<string, { income: number; expense: number }> = {}
      evts.forEach((e: any) => {
        const m = (e.event_date || '').slice(0, 7)
        if (!m) return
        if (!monthly[m]) monthly[m] = { income: 0, expense: 0 }
        monthly[m].income += Number(e.total_amount) || 0
      })
      pays.forEach((p: any) => {
        const m = (p.payment_date || '').slice(0, 7)
        if (!m) return
        if (!monthly[m]) monthly[m] = { income: 0, expense: 0 }
        if (p.type === 'incoming') monthly[m].income += Number(p.amount) || 0
        else monthly[m].expense += Number(p.amount) || 0
      })
      const chartData = Object.entries(monthly).map(([month, vals]) => ({
        month,
        income: vals.income,
        expense: vals.expense,
        profit: vals.income - vals.expense,
      })).sort((a: any, b: any) => a.month.localeCompare(b.month))
      setData(chartData)
    } catch (error) {
      console.error('Error fetching profit/loss:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-64 bg-muted rounded animate-pulse" /></CardContent></Card>
  }

  const totalIncome = data.reduce((s: number, d: any) => s + d.income, 0)
  const totalExpense = data.reduce((s: number, d: any) => s + d.expense, 0)

  return (
    <Card>
      <CardHeader><CardTitle>{language === 'en' ? 'Profit & Loss' : 'लाभ/हानि'}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div><span className="text-sm text-muted-foreground">{language === 'en' ? 'Income' : 'आय'}: </span><span className="font-bold text-green-600">{formatCurrency(totalIncome, language)}</span></div>
          <div><span className="text-sm text-muted-foreground">{language === 'en' ? 'Expense' : 'व्यय'}: </span><span className="font-bold text-red-600">{formatCurrency(totalExpense, language)}</span></div>
          <div><span className="text-sm text-muted-foreground">{language === 'en' ? 'Profit' : 'लाभ'}: </span><span className="font-bold">{formatCurrency(totalIncome - totalExpense, language)}</span></div>
        </div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-muted-foreground text-center py-8">No data available</p>}
      </CardContent>
    </Card>
  )
}
