'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, addDays, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DatePickerProps {
  currentDate?: string
}

export function DatePicker({ currentDate }: DatePickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasDate = !!currentDate
  const date = hasDate ? new Date(currentDate + 'T00:00:00') : null

  const goToDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('date', format(newDate, 'yyyy-MM-dd'))
    router.push(`/judge?${params.toString()}`)
  }

  const clearDate = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('date')
    const queryString = params.toString()
    router.push(`/judge${queryString ? `?${queryString}` : ''}`)
  }

  const goToPrev = () => {
    if (date) goToDate(subDays(date, 1))
  }

  const goToNext = () => {
    if (date) goToDate(addDays(date, 1))
  }

  const goToToday = () => {
    goToDate(new Date())
  }

  // "All Dates" mode — show a simple button to pick today
  if (!hasDate) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white min-w-[180px] justify-center">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">All Dates</span>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Filter by date
        </Button>
      </div>
    )
  }

  // Specific date mode
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={goToPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-white min-w-[180px] justify-center">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium">
          {format(date!, 'EEEE, MMM d, yyyy')}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNext}
        disabled={isToday(date!)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button variant="outline" size="icon" onClick={clearDate} title="Show all dates">
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
