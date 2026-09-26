'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function DateRangePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date range',
}: {
  date?: { from?: Date; to?: Date }
  onDateChange: (range?: { from?: Date; to?: Date }) => void
  placeholder?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? date.to ? `${format(date.from, 'PPP')} - ${format(date.to, 'PPP')}` : format(date.from, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar value={date?.from} onChange={(d) => onDateChange({ ...date, from: d })} />
      </PopoverContent>
    </Popover>
  )
}
