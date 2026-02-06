'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChevronDown, ChevronUp, Image, Video } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  submission_date: string
  profiles: {
    full_name: string | null
    email: string
  }
  assetCount: number
  imageCount: number
  videoCount: number
  ratingCount: number
  avgProductivity: number | null
  avgQuality: number | null
  avgConvertability: number | null
  avgTotal: number | null
}

interface SubmissionsTableProps {
  submissions: Submission[]
  designers: { id: string; full_name: string | null; email: string }[]
}

type SortField = 'date' | 'assets' | 'total'
type SortDirection = 'asc' | 'desc'

export function SubmissionsTable({
  submissions,
  designers,
}: SubmissionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [designerFilter, setDesignerFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  const filteredSubmissions = submissions
    .filter((sub) => {
      if (designerFilter !== 'all' && sub.profiles.email !== designerFilter) {
        return false
      }
      if (dateFilter && !sub.submission_date.includes(dateFilter)) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1

      if (sortField === 'date') {
        return (
          multiplier *
          (new Date(a.submission_date).getTime() -
            new Date(b.submission_date).getTime())
        )
      }
      if (sortField === 'assets') {
        return multiplier * (a.assetCount - b.assetCount)
      }
      if (sortField === 'total') {
        const aTotal = a.avgTotal || 0
        const bTotal = b.avgTotal || 0
        return multiplier * (aTotal - bTotal)
      }
      return 0
    })

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

  const formatScore = (score: number | null) => {
    if (score === null) return '-'
    return score.toFixed(1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">All Submissions</CardTitle>
          <div className="flex gap-2">
            <Select value={designerFilter} onValueChange={setDesignerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Designers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designers</SelectItem>
                {designers.map((d) => (
                  <SelectItem key={d.id} value={d.email}>
                    {d.full_name || d.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[160px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date <SortIcon field="date" />
                  </div>
                </TableHead>
                <TableHead>Designer</TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('assets')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Assets <SortIcon field="assets" />
                  </div>
                </TableHead>
                <TableHead className="text-center">Productivity</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="text-center">Convertability</TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSort('total')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Total <SortIcon field="total" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No submissions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(sub.submission_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {sub.profiles.full_name || sub.profiles.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Badge variant="secondary" className="gap-1">
                          <Image className="h-3 w-3" />
                          {sub.imageCount}
                        </Badge>
                        {sub.videoCount > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Video className="h-3 w-3" />
                            {sub.videoCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center font-medium',
                        sub.avgProductivity === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(sub.avgProductivity)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center font-medium',
                        sub.avgQuality === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(sub.avgQuality)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center font-medium',
                        sub.avgConvertability === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(sub.avgConvertability)}
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.avgTotal !== null ? (
                        <span className="font-bold">{formatScore(sub.avgTotal)}</span>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">
                          Not rated
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Showing {filteredSubmissions.length} of {submissions.length} submissions
        </p>
      </CardContent>
    </Card>
  )
}
