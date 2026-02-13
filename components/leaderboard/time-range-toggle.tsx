'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month'

interface TimeRangeToggleProps {
  currentRange: TimeRange
  basePath?: string
}

export function TimeRangeToggle({ currentRange, basePath = '/leaderboard' }: TimeRangeToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <Tabs value={currentRange} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
        <TabsTrigger value="week">Last 7 Days</TabsTrigger>
        <TabsTrigger value="month">Last 30 Days</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
