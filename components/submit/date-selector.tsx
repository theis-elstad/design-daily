'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { format, subDays, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  const canGoNewer = !isToday(selectedDate)
  const canGoOlder = dates.some((d) => d < selectedDate)

  const goNewer = () => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    if (currentIndex > 0) {
      handleDateChange(dates[currentIndex - 1])
    }
  }

  const goOlder = () => {
    const currentIndex = dates.findIndex((d) => format(d, 'yyyy-MM-dd') === currentDate)
    if (currentIndex < dates.length - 1) {
      handleDateChange(dates[currentIndex + 1])
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation arrows and current date */}
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

      {/* Date pills */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {dates.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const isSelected = dateStr === currentDate
          const dayIsToday = isToday(date)

          return (
            <button
              key={dateStr}
              onClick={() => handleDateChange(date)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {dayIsToday ? 'Today' : format(date, 'EEE d')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
