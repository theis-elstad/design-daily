'use client'

import { useRef } from 'react'
import { format, getISOWeek } from 'date-fns'
import { Trophy, Download, Medal, Image, Video } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn, getAvatarUrl } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types/database'
import type { TimeRange } from './time-range-toggle'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  isAdmin: boolean
  currentRange: TimeRange
  weekOffset?: number
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

function getLastBusinessDay(): Date {
  const today = new Date()
  const dow = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  let offset: number
  if (dow === 0) offset = 2       // Sunday -> Friday
  else if (dow === 1) offset = 3  // Monday -> Friday
  else if (dow === 6) offset = 1  // Saturday -> Friday
  else offset = 1                 // Tue-Fri -> previous day
  const d = new Date(today)
  d.setDate(d.getDate() - offset)
  return d
}

function getWeeklyFriday(weekOffset: number = 0): Date {
  const today = new Date()
  const dow = today.getDay()
  const daysSinceFriday = ((dow - 5) + 7) % 7
  const friday = new Date(today)
  friday.setDate(friday.getDate() - daysSinceFriday + (weekOffset * 7))
  return friday
}

function getWeeklyDayNumber(): number {
  // Day 1 = Friday, Day 2 = Monday, Day 3 = Tuesday, Day 4 = Wednesday, Day 5 = Thursday
  // Weekend days (Sat/Sun) show as Day 1 still (last business day was Friday)
  const dow = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const dayMap: Record<number, number> = {
    5: 1, // Friday
    6: 1, // Saturday (still day 1)
    0: 1, // Sunday (still day 1)
    1: 2, // Monday
    2: 3, // Tuesday
    3: 4, // Wednesday
    4: 5, // Thursday
  }
  return dayMap[dow]
}

function getRangeLabel(range: TimeRange, weekOffset: number = 0): string {
  const today = new Date()
  switch (range) {
    case 'today':
      return format(today, 'MMMM d, yyyy')
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return format(yesterday, 'MMMM d, yyyy')
    }
    case 'last_business_day':
      return format(getLastBusinessDay(), 'MMMM d, yyyy')
    case 'weekly': {
      const friday = getWeeklyFriday(weekOffset)
      const thursday = new Date(friday)
      thursday.setDate(thursday.getDate() + 6)
      // Week number is based on the Thursday (end of cycle)
      const weekNum = getISOWeek(thursday)
      // Always show full Fri-Thu range
      const sameMonth = friday.getMonth() === thursday.getMonth()
      const dateRange = sameMonth
        ? `${format(friday, 'MMM d')} - ${format(thursday, 'd')}`
        : `${format(friday, 'MMM d')} - ${format(thursday, 'MMM d')}`
      // Day number (only for current week)
      const dayStr = weekOffset === 0 ? ` - Day ${getWeeklyDayNumber()}/5` : ''
      return `Week ${weekNum} (${dateRange})${dayStr}`
    }
    case 'week':
      return 'Last 7 Days'
    case 'month':
      return 'Last 30 Days'
    case 'all':
      return 'All Time'
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

export function LeaderboardPodium({ entries, isAdmin, currentRange, weekOffset = 0 }: LeaderboardPodiumProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const showCumulative = currentRange === 'weekly'

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
          <p className="text-sm text-gray-300">{getRangeLabel(currentRange, weekOffset)}</p>
        </div>

        {/* Group headers (weekly only) */}
        {showCumulative && (
          <div className="flex items-center px-4 sm:px-6 pt-3 pb-0 bg-gray-50">
            {/* Spacer for rank + avatar + name */}
            <div className="w-8 shrink-0" />
            <div className="w-9 shrink-0 ml-4" />
            <div className="flex-1 min-w-0 ml-4" />
            {/* Weekly group label - spans Productivity, Quality, Avg Total, Cumulative */}
            <div className="flex items-center gap-4">
              <div className="w-20 shrink-0" />
              <div className="w-20 shrink-0" />
              <div className="w-20 shrink-0" />
              <div className="w-24 shrink-0 text-center">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Weekly</span>
              </div>
            </div>
            {/* Daily group label - spans Statics, Video, Added */}
            <div className="flex items-center gap-4 ml-4 pl-4 border-l-2 border-amber-300">
              <div className="w-14 shrink-0" />
              <div className="w-14 shrink-0" />
              <div className="w-16 shrink-0 text-center">
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Daily</span>
              </div>
            </div>
          </div>
        )}

        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3 border-b bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <div className="w-8 shrink-0" />
          <div className="w-9 shrink-0" />
          <div className="flex-1 min-w-0">Name</div>
          <div className="w-20 text-right shrink-0">Productivity</div>
          <div className="w-20 text-right shrink-0">Quality</div>
          <div className="w-20 text-right shrink-0">Avg Total</div>
          {showCumulative && (
            <>
              <div className="w-24 text-right shrink-0">Cumulative</div>
              {/* Daily columns - visually distinct */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l-2 border-amber-300">
                <div className="w-14 text-right shrink-0 text-amber-700">
                  <div className="flex items-center justify-end gap-1">
                    <Image className="h-3 w-3" />
                    <span>Statics</span>
                  </div>
                </div>
                <div className="w-14 text-right shrink-0 text-amber-700">
                  <div className="flex items-center justify-end gap-1">
                    <Video className="h-3 w-3" />
                    <span>Video</span>
                  </div>
                </div>
                <div className="w-16 text-right shrink-0 text-amber-700">Added</div>
              </div>
            </>
          )}
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

                {showCumulative && (
                  <>
                    {/* Cumulative (weekly) */}
                    <div className="w-24 text-right shrink-0">
                      <span className="text-gray-600 font-semibold">
                        {formatScore(entry.cumulative_total_score || 0)}
                      </span>
                    </div>

                    {/* Daily group - visually distinct */}
                    <div className="flex items-center gap-4 ml-4 pl-4 border-l-2 border-amber-300">
                      {/* Statics (last biz day) */}
                      <div className="w-14 text-right shrink-0">
                        <span className="text-amber-800 text-sm">{entry.daily_static_count || 0}</span>
                      </div>

                      {/* Video (last biz day) */}
                      <div className="w-14 text-right shrink-0">
                        <span className="text-amber-800 text-sm">{entry.daily_video_count || 0}</span>
                      </div>

                      {/* Added (last biz day score) */}
                      <div className="w-16 text-right shrink-0">
                        <span className="text-amber-700 font-medium text-sm">
                          {entry.last_day_added ? `+${formatScore(entry.last_day_added)}` : '–'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
