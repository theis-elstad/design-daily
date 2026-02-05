import { Trophy, Medal } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrendIndicator } from './trend-indicator'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types/database'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
        <Trophy className="h-5 w-5 text-yellow-600" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
        <Medal className="h-5 w-5 text-gray-500" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
        <Medal className="h-5 w-5 text-orange-600" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="text-gray-500 font-medium">{rank}</span>
    </div>
  )
}

function formatScore(score: number) {
  return score.toFixed(1)
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No submissions yet for this time period.</p>
        <p className="text-sm mt-1">Submit your work to appear on the leaderboard!</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Designer</TableHead>
            <TableHead className="text-center">Submissions</TableHead>
            <TableHead className="text-center">Productivity</TableHead>
            <TableHead className="text-center">Quality</TableHead>
            <TableHead className="text-center">Convertability</TableHead>
            <TableHead className="text-center">Total Avg</TableHead>
            <TableHead className="w-16">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const initials = entry.full_name
              ? entry.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
              : '?'

            return (
              <TableRow
                key={entry.user_id}
                className={cn(
                  entry.rank <= 3 && 'bg-gradient-to-r',
                  entry.rank === 1 && 'from-yellow-50 to-transparent',
                  entry.rank === 2 && 'from-gray-50 to-transparent',
                  entry.rank === 3 && 'from-orange-50 to-transparent'
                )}
              >
                <TableCell>
                  <RankBadge rank={entry.rank} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className={cn(
                          entry.rank === 1 && 'bg-yellow-200 text-yellow-800',
                          entry.rank === 2 && 'bg-gray-200 text-gray-800',
                          entry.rank === 3 && 'bg-orange-200 text-orange-800'
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{entry.full_name || 'Unknown'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{entry.total_submissions}</Badge>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {formatScore(entry.avg_productivity)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {formatScore(entry.avg_quality)}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {formatScore(entry.avg_convertability)}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-lg">
                    {formatScore(entry.avg_total_score)}
                  </span>
                </TableCell>
                <TableCell>
                  <TrendIndicator trend={entry.trend || 'same'} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
