'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDesignerProductivityData, type TimeRange } from '@/lib/actions/admin'
import { Loader2 } from 'lucide-react'

// Color palette for designers
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

interface DesignerProductivityChartProps {
  initialData: Awaited<ReturnType<typeof getDesignerProductivityData>>
}

export function DesignerProductivityChart({ initialData }: DesignerProductivityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialData.timeRange)
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (timeRange !== data.timeRange) {
      startTransition(async () => {
        const newData = await getDesignerProductivityData(timeRange)
        setData(newData)
      })
    }
  }, [timeRange, data.timeRange])

  const chartData = data.chartData.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'MMM d'),
  }))

  const designerNames = data.designers.map((d) => d.name)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Designer Productivity</CardTitle>
        <Tabs
          value={timeRange}
          onValueChange={(v) => setTimeRange(v as TimeRange)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="today" className="text-xs px-2 h-6">
              Today
            </TabsTrigger>
            <TabsTrigger value="yesterday" className="text-xs px-2 h-6">
              Yesterday
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2 h-6">
              7 Days
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-2 h-6">
              30 Days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  label={{
                    value: 'Assets',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: '#6b7280' },
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded shadow-sm">
                          <p className="text-sm font-medium mb-2">{label}</p>
                          {payload.map((entry, index) => (
                            <p
                              key={index}
                              className="text-sm"
                              style={{ color: entry.color }}
                            >
                              {entry.name}: {entry.value} assets
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                {designerNames.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    stackId="assets"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No data available for this time period
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing assets submitted per designer from {format(parseISO(data.startDate), 'MMM d')} to{' '}
          {format(parseISO(data.endDate), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  )
}
