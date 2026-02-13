'use client'

import { useRef } from 'react'
import { format } from 'date-fns'
import { Trophy, Download, Medal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, getAvatarUrl } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types/database'
import type { TimeRange } from './time-range-toggle'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  isAdmin: boolean
  currentRange: TimeRange
}

function formatScore(score: number) {
  return score.toFixed(1)
}

function getInitials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getRangeLabel(range: TimeRange): string {
  const today = new Date()
  switch (range) {
    case 'today':
      return format(today, 'MMMM d, yyyy')
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return format(yesterday, 'MMMM d, yyyy')
    }
    case 'week':
      return 'Last 7 Days'
    case 'month':
      return 'Last 30 Days'
  }
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        <Medal className="h-6 w-6 text-yellow-500" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        <Medal className="h-6 w-6 text-gray-400" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        <Medal className="h-6 w-6 text-orange-400" />
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 shrink-0">
      <span className="text-gray-500 font-medium">{rank}</span>
    </div>
  )
}

export function LeaderboardPodium({ entries, isAdmin, currentRange }: LeaderboardPodiumProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!listRef.current) return

    try {
      const htmlToImage = await import('html-to-image')

      const dataUrl = await htmlToImage.toPng(listRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = `leaderboard-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to download leaderboard image:', error)
    }
  }

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
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}

      <div
        ref={listRef}
        className="bg-white rounded-lg overflow-hidden"
      >
        {/* Banner */}
        <div className="px-4 sm:px-6 py-4 bg-gray-900 text-white">
          <h2 className="text-lg font-bold">Design Daily Leaderboard</h2>
          <p className="text-sm text-gray-300">{getRangeLabel(currentRange)}</p>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="w-8 shrink-0" />
          <div className="w-9 shrink-0" />
          <div className="flex-1 min-w-0">Name</div>
          <div className="w-20 text-right shrink-0">Productivity</div>
          <div className="w-20 text-right shrink-0">Quality</div>
          <div className="w-20 text-right shrink-0">Total</div>
        </div>

        {/* Entries */}
        <div className="divide-y">
          {entries.map((entry) => {
            const avatarUrl = getAvatarUrl(entry.avatar_path)
            const isTopThree = entry.rank <= 3

            return (
              <div
                key={entry.user_id}
                className={cn(
                  'flex items-center gap-4 px-4 sm:px-6 py-3',
                  isTopThree && 'bg-gray-50/50'
                )}
              >
                {/* Rank */}
                <RankBadge rank={entry.rank} />

                {/* Avatar */}
                <Avatar className={cn(
                  'h-9 w-9 shrink-0',
                  entry.rank === 1 && 'ring-2 ring-yellow-500',
                  entry.rank === 2 && 'ring-2 ring-gray-400',
                  entry.rank === 3 && 'ring-2 ring-orange-400',
                )}>
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={entry.full_name || 'Avatar'} />
                  )}
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                    {getInitials(entry.full_name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'truncate',
                    isTopThree ? 'font-semibold' : 'font-medium'
                  )}>
                    {entry.full_name || 'Unknown'}
                  </p>
                </div>

                {/* Productivity */}
                <div className="w-20 text-right shrink-0">
                  <span className="text-gray-600">{formatScore(entry.avg_productivity)}</span>
                </div>

                {/* Quality */}
                <div className="w-20 text-right shrink-0">
                  <span className="text-gray-600">{formatScore(entry.avg_quality)}</span>
                </div>

                {/* Total */}
                <div className="w-20 text-right shrink-0">
                  <span className={cn(
                    'font-bold text-lg',
                    entry.rank === 1 && 'text-yellow-600',
                    entry.rank === 2 && 'text-gray-600',
                    entry.rank === 3 && 'text-orange-600',
                  )}>
                    {formatScore(entry.avg_total_score)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
