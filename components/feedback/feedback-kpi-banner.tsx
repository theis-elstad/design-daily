'use client'

import { useState, useTransition } from 'react'
import { Image, Video, TrendingUp, Star, BarChart3, Hash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getMyFeedback, type FeedbackKPIs, type FeedbackRow } from '@/lib/actions/feedback'
import { cn } from '@/lib/utils'

const timeRanges = [
  { value: 'last_biz_day', label: 'Last Biz Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'last_30', label: 'Last 30' },
  { value: 'all', label: 'All Time' },
] as const

interface FeedbackKpiBannerProps {
  initialKpis: FeedbackKPIs
  initialTimeRange: string
  onDataChange: (rows: FeedbackRow[], kpis: FeedbackKPIs) => void
}

export function FeedbackKpiBanner({ initialKpis, initialTimeRange, onDataChange }: FeedbackKpiBannerProps) {
  const [kpis, setKpis] = useState(initialKpis)
  const [activeRange, setActiveRange] = useState(initialTimeRange)
  const [isPending, startTransition] = useTransition()

  const handleRangeChange = (range: string) => {
    setActiveRange(range)
    startTransition(async () => {
      const { rows, kpis: newKpis } = await getMyFeedback(range)
      setKpis(newKpis)
      onDataChange(rows, newKpis)
    })
  }

  const kpiCards = [
    { label: 'Submissions', value: kpis.totalSubmissions, icon: Hash },
    { label: 'Statics', value: kpis.statics, icon: Image },
    { label: 'Videos', value: kpis.videos, icon: Video },
    { label: 'Avg Productivity', value: kpis.avgProductivity.toFixed(1), icon: TrendingUp },
    { label: 'Avg Quality', value: kpis.avgQuality.toFixed(1), icon: Star },
    { label: 'Avg Total', value: kpis.avgTotal.toFixed(1), icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      {/* Time range toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeChange(range.value)}
            disabled={isPending}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeRange === range.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3', isPending && 'opacity-50')}>
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
