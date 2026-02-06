'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DesignerStat {
  id: string
  name: string | null
  totalSubmissions: number
  totalAssets: number
  avgProductivity: number | null
  avgQuality: number | null
  avgConvertability: number | null
  avgTotal: number | null
}

interface DesignerStatsTableProps {
  stats: DesignerStat[]
}

type SortField = 'name' | 'submissions' | 'assets' | 'productivity' | 'quality' | 'convertability' | 'total'
type SortDirection = 'asc' | 'desc'

export function DesignerStatsTable({ stats }: DesignerStatsTableProps) {
  const [sortField, setSortField] = useState<SortField>('total')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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
      case 'assets':
        return multiplier * (a.totalAssets - b.totalAssets)
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
      <CardHeader>
        <CardTitle className="text-lg">Designer Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
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
                  onClick={() => toggleSort('assets')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Assets <SortIcon field="assets" />
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
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                    <TableCell className="text-center">{stat.totalAssets}</TableCell>
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
