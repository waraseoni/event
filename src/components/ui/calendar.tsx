'use client'

import { useState } from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Calendar({ value, onChange, className }: { value?: Date; onChange?: (d: Date) => void; className?: string }) {
  const [month, setMonth] = useState(value ?? new Date())
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="sm" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="text-sm font-semibold">{format(month, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="sm" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <button key={i} onClick={() => onChange?.(d)} className={cn('h-8 w-full rounded text-sm hover:bg-slate-100 dark:hover:bg-slate-800', isSameDay(d, value ?? new Date()) && 'bg-indigo-600 text-white', isToday(d) && 'border border-indigo-300')}>{format(d, 'd')}</button>
        ))}
      </div>
    </div>
  )
}
