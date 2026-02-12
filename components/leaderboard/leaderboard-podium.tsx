'use client'

import { useRef } from 'react'
import { Trophy, Download } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendIndicator } from './trend-indicator'
import { cn, getAvatarUrl } from '@/lib/utils'
import type { LeaderboardEntry } from '@/lib/types/database'

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[]
  isAdmin: boolean
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

// Group entries by rank to handle ties
function groupByRank(entries: LeaderboardEntry[]) {
  const groups: Record<number, LeaderboardEntry[]> = {}
  entries.forEach((entry) => {
    if (!groups[entry.rank]) {
      groups[entry.rank] = []
    }
    groups[entry.rank].push(entry)
  })
  return groups
}

interface PodiumPlaceProps {
  entries: LeaderboardEntry[]
  place: 1 | 2 | 3
  height: string
  bgColor: string
  avatarBg: string
  avatarText: string
  medalColor: string
}

function PodiumPlace({
  entries,
  place,
  height,
  bgColor,
  avatarBg,
  avatarText,
  medalColor,
}: PodiumPlaceProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className={cn('w-24 sm:w-32 rounded-t-lg flex items-end justify-center', bgColor, height)}>
          <span className="text-4xl font-bold text-white/50 mb-4">{place}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* Names and avatars */}
      <div className="flex flex-wrap justify-center gap-2 mb-3 max-w-[200px]">
        {entries.map((entry) => {
          const avatarUrl = getAvatarUrl(entry.avatar_path)
          return (
            <div key={entry.user_id} className="flex flex-col items-center">
              <Avatar className={cn('h-12 w-12 sm:h-16 sm:w-16 border-4', medalColor)}>
                {avatarUrl && (
                  <AvatarImage src={avatarUrl} alt={entry.full_name || 'Avatar'} />
                )}
                <AvatarFallback className={cn(avatarBg, avatarText, 'text-lg sm:text-xl font-bold')}>
                  {getInitials(entry.full_name)}
                </AvatarFallback>
              </Avatar>
              <p className="mt-1 text-xs sm:text-sm font-medium text-center max-w-[80px] truncate">
                {entry.full_name?.split(' ')[0] || 'Unknown'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Score */}
      <div className="mb-2">
        <span className="text-xl sm:text-2xl font-bold">{formatScore(entries[0].avg_total_score)}</span>
        <span className="text-xs text-gray-500 ml-1">pts</span>
      </div>

      {/* Podium block */}
      <div
        className={cn(
          'w-24 sm:w-32 rounded-t-lg flex items-end justify-center transition-all',
          bgColor,
          height
        )}
      >
        <span className="text-4xl sm:text-5xl font-bold text-white/80 mb-2 sm:mb-4">{place}</span>
      </div>
    </div>
  )
}

export function LeaderboardPodium({ entries, isAdmin }: LeaderboardPodiumProps) {
  const podiumRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!podiumRef.current) return

    try {
      const htmlToImage = await import('html-to-image')

      const dataUrl = await htmlToImage.toPng(podiumRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = `leaderboard-${new Date().toISOString().split('T')[0]}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Failed to download podium image:', error)
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

  // Group entries by rank
  const groupedByRank = groupByRank(entries)

  // Get entries for each podium position (handling ties)
  const firstPlace = groupedByRank[1] || []
  const secondPlace = groupedByRank[2] || []
  const thirdPlace = groupedByRank[3] || []

  // Collect all user_ids on the podium (ranks 1, 2, 3) to exclude from the list below
  const podiumUserIds = new Set<string>()
  ;[firstPlace, secondPlace, thirdPlace].forEach((group) => {
    group.forEach((e) => podiumUserIds.add(e.user_id))
  })

  // Remaining entries: anyone not on the podium
  const restEntries = entries.filter((e) => !podiumUserIds.has(e.user_id))

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

      {/* Podium */}
      <div
        ref={podiumRef}
        className="bg-white p-6 sm:p-8 rounded-lg"
      >
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          {/* Second place - left */}
          <PodiumPlace
            entries={secondPlace}
            place={2}
            height="h-28 sm:h-36"
            bgColor="bg-gray-400"
            avatarBg="bg-gray-200"
            avatarText="text-gray-800"
            medalColor="border-gray-400"
          />

          {/* First place - center */}
          <PodiumPlace
            entries={firstPlace}
            place={1}
            height="h-36 sm:h-48"
            bgColor="bg-yellow-500"
            avatarBg="bg-yellow-200"
            avatarText="text-yellow-800"
            medalColor="border-yellow-500"
          />

          {/* Third place - right */}
          <PodiumPlace
            entries={thirdPlace}
            place={3}
            height="h-20 sm:h-28"
            bgColor="bg-orange-400"
            avatarBg="bg-orange-200"
            avatarText="text-orange-800"
            medalColor="border-orange-400"
          />
        </div>

        {/* Show message if there are ties */}
        {(firstPlace.length > 1 || secondPlace.length > 1 || thirdPlace.length > 1) && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Tied designers share the podium position
          </p>
        )}
      </div>

      {/* Remaining rankings list */}
      {restEntries.length > 0 && (
        <div className="border rounded-lg divide-y">
          {restEntries.map((entry) => {
            const avatarUrl = getAvatarUrl(entry.avatar_path)
            return (
              <div
                key={entry.user_id}
                className="flex items-center gap-4 px-4 py-3"
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 shrink-0">
                  <span className="text-gray-500 font-medium">{entry.rank}</span>
                </div>

                {/* Avatar + Name */}
                <Avatar className="h-9 w-9 shrink-0">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={entry.full_name || 'Avatar'} />
                  )}
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                    {getInitials(entry.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{entry.full_name || 'Unknown'}</p>
                </div>

                {/* Submissions count */}
                <Badge variant="secondary" className="shrink-0">
                  {entry.total_submissions}
                </Badge>

                {/* Score */}
                <span className="font-bold text-lg shrink-0 w-16 text-right">
                  {formatScore(entry.avg_total_score)}
                </span>

                {/* Trend */}
                <div className="shrink-0 w-6">
                  <TrendIndicator trend={entry.trend || 'same'} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
