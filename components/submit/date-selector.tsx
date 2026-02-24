'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, isToday, parseISO, isWeekend } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DateSelectorProps {
  currentDate: string
  maxDaysBack?: number
}

export function DateSelector({ currentDate, maxDaysBack = 7 }: DateSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedDate = parseISO(currentDate)

  // Generate array of dates from today to maxDaysBack
  const dates = Array.from({ length: maxDaysBack + 1 }, (_, i) => subDays(today, i))

  const handleDateChange = (date: Date) => {
    if (isWeekend(date)) return

    const dateStr = format(date, 'yyyy-MM-dd')
    const params = new URLSearchParams(searchParams.toString())

    if (isToday(date)) {
      params.delete('date')
    } else {
      params.set('date', dateStr)
    }

    const queryString = params.toString()
    router.push(`/submit${queryString ? `?${queryString}` : ''}`)
  }

  // Check if there's a weekday in the newer direction
  const canGoNewer = (() => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isWeekend(dates[i])) return true
    }
    return false
  })()

  // Check if there's a weekday in the older direction
  const canGoOlder = (() => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    for (let i = currentIndex + 1; i < dates.length; i++) {
      if (!isWeekend(dates[i])) return true
    }
    return false
  })()

  const goNewer = () => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (!isWeekend(dates[i])) {
        handleDateChange(dates[i])
        return
      }
    }
  }

  const goOlder = () => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    for (let i = currentIndex + 1; i < dates.length; i++) {
      if (!isWeekend(dates[i])) {
        handleDateChange(dates[i])
        return
      }
    }
  }

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        size="icon"
        onClick={goOlder}
        disabled={!canGoOlder}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 text-sm font-medium">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>
          {isToday(selectedDate)
            ? 'Today'
            : format(selectedDate, 'EEEE, MMM d')}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={goNewer}
        disabled={!canGoNewer}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
