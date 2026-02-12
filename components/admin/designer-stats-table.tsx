'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, Image, Video } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getDesignerStats, type DesignerStatsTimeRange } from '@/lib/actions/admin'

interface DesignerStat {
  id: string
  name: string | null
  totalSubmissions: number
  staticAssets: number
  videoAssets: number
  avgProductivity: number | null
  avgQuality: number | null
  avgConvertability: number | null
  avgTotal: number | null
}

interface DesignerStatsTableProps {
  stats: DesignerStat[]
}

type SortField = 'name' | 'submissions' | 'static' | 'video' | 'productivity' | 'quality' | 'convertability' | 'total'
type SortDirection = 'asc' | 'desc'

const timeRangeOptions: { value: DesignerStatsTimeRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: 'all', label: 'All Time' },
]

export function DesignerStatsTable({ stats: initialStats }: DesignerStatsTableProps) {
  const [stats, setStats] = useState(initialStats)
  const [sortField, setSortField] = useState<SortField>('total')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activeRange, setActiveRange] = useState<DesignerStatsTimeRange>('all')
  const [isPending, startTransition] = useTransition()

  const formatScore = (score: number | null) => {
    if (score === null) return '-'
    return score.toFixed(2)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleTimeRangeChange = (range: DesignerStatsTimeRange) => {
    setActiveRange(range)
    startTransition(async () => {
      const newStats = await getDesignerStats(range)
      setStats(newStats)
    })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    )
  }

  const sortedStats = [...stats].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1

    switch (sortField) {
      case 'name': {
        const aName = a.name || ''
        const bName = b.name || ''
        return multiplier * aName.localeCompare(bName)
      }
      case 'submissions':
        return multiplier * (a.totalSubmissions - b.totalSubmissions)
      case 'static':
        return multiplier * (a.staticAssets - b.staticAssets)
      case 'video':
        return multiplier * (a.videoAssets - b.videoAssets)
      case 'productivity': {
        const aVal = a.avgProductivity ?? -Infinity
        const bVal = b.avgProductivity ?? -Infinity
        return multiplier * (aVal - bVal)
      }
      case 'quality': {
        const aVal = a.avgQuality ?? -Infinity
        const bVal = b.avgQuality ?? -Infinity
        return multiplier * (aVal - bVal)
      }
      case 'convertability': {
        const aVal = a.avgConvertability ?? -Infinity
        const bVal = b.avgConvertability ?? -Infinity
        return multiplier * (aVal - bVal)
      }
      case 'total': {
        const aVal = a.avgTotal ?? -Infinity
        const bVal = b.avgTotal ?? -Infinity
        return multiplier * (aVal - bVal)
      }
      default:
        return 0
    }
  })

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-lg">Designer Performance Summary</CardTitle>
        <div className="flex items-center gap-1">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeChange(option.value)}
              disabled={isPending}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('border rounded-lg overflow-hidden', isPending && 'opacity-50')}>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Designer <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('submissions')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Submissions <SortIcon field="submissions" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('static')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Image className="h-3.5 w-3.5" />
                    Static <SortIcon field="static" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('video')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    Video <SortIcon field="video" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('productivity')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Avg Productivity <SortIcon field="productivity" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('quality')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Avg Quality <SortIcon field="quality" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('convertability')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Avg Convertability <SortIcon field="convertability" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('total')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Avg Total <SortIcon field="total" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No designer data available
                  </TableCell>
                </TableRow>
              ) : (
                sortedStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">
                      {stat.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-center">{stat.totalSubmissions}</TableCell>
                    <TableCell className="text-center">{stat.staticAssets}</TableCell>
                    <TableCell className="text-center">{stat.videoAssets}</TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgProductivity === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgProductivity)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgQuality === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgQuality)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgConvertability === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgConvertability)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatScore(stat.avgTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
