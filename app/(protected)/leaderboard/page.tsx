export const runtime = 'edge'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardPodium } from '@/components/leaderboard/leaderboard-podium'
import { TimeRangeToggle, type TimeRange } from '@/components/leaderboard/time-range-toggle'
import { WeekNavigator } from '@/components/leaderboard/week-navigator'
import { Skeleton } from '@/components/ui/skeleton'
import type { LeaderboardEntry } from '@/lib/types/database'

interface LeaderboardPageProps {
  searchParams: Promise<{ range?: TimeRange; week_offset?: string }>
}

async function LeaderboardData({
  range,
  isAdmin,
  weekOffset,
}: {
  range: TimeRange
  isAdmin: boolean
  weekOffset: number
}) {
  const supabase = await createClient()

  // Build RPC params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcParams: any = { time_range: range }
  if (range === 'weekly') {
    rpcParams.week_offset = weekOffset
  }

  // Get current period leaderboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentLeaderboard } = await (supabase.rpc as any)('get_leaderboard', rpcParams)

  // Get previous period for trend calculation (only for longer ranges)
  let previousLeaderboard = null
  if (range === 'week' || range === 'month') {
    const previousRange = range === 'week' ? 'month' : 'week'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.rpc as any)('get_leaderboard', {
      time_range: previousRange,
    })
    previousLeaderboard = data
  }

  // For weekly view: fetch last business day scores (for "Added" column)
  let lastBizDayLeaderboard = null
  if (range === 'weekly') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.rpc as any)('get_leaderboard', {
      time_range: 'last_business_day',
    })
    lastBizDayLeaderboard = data
  }

  // Fetch avatar paths for all users in the leaderboard
  const userIds = (currentLeaderboard || []).map((e: { user_id: string }) => e.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_path')
    .in('id', userIds)

  const avatarMap = new Map(
    (profiles || []).map((p: { id: string; avatar_path: string | null }) => [p.id, p.avatar_path])
  )

  // Type the raw data
  type RawLeaderboardEntry = Omit<LeaderboardEntry, 'trend' | 'avatar_path' | 'avg_score_delta' | 'last_day_added'>
  const current: RawLeaderboardEntry[] = currentLeaderboard || []
  const previous: RawLeaderboardEntry[] = previousLeaderboard || []
  const lastBizDay: RawLeaderboardEntry[] = lastBizDayLeaderboard || []

  // Calculate trends by comparing ranks and add avatar paths
  const leaderboardWithTrends: LeaderboardEntry[] = current.map((entry) => {
    const previousEntry = previous.find((p) => p.user_id === entry.user_id)

    let trend: 'up' | 'down' | 'same' = 'same'
    if (previousEntry) {
      if (entry.rank < previousEntry.rank) trend = 'up'
      else if (entry.rank > previousEntry.rank) trend = 'down'
    }

    // Last day added: cumulative_total_score from last_business_day (single day = total for that day)
    let last_day_added: number | undefined
    let daily_static_count: number | undefined
    let daily_video_count: number | undefined
    if (range === 'weekly') {
      const lastDayEntry = lastBizDay.find((p) => p.user_id === entry.user_id)
      if (lastDayEntry) {
        last_day_added = lastDayEntry.cumulative_total_score
        daily_static_count = lastDayEntry.static_count
        daily_video_count = lastDayEntry.video_count
      }
    }

    // Avg score delta: how avg_total_score changed after last submission
    // previous_avg = (cumulative - last_day_added) / (submissions - 1)
    // delta = current_avg - previous_avg
    let avg_score_delta: number | undefined
    if (range === 'weekly' && last_day_added && entry.cumulative_total_score && entry.total_submissions > 1) {
      const previousAvg = (entry.cumulative_total_score - last_day_added) / (entry.total_submissions - 1)
      avg_score_delta = Math.round((entry.avg_total_score - previousAvg) * 10) / 10
    }

    return { ...entry, trend, avatar_path: avatarMap.get(entry.user_id) || null, avg_score_delta, last_day_added, daily_static_count, daily_video_count }
  })

  return (
    <LeaderboardPodium
      entries={leaderboardWithTrends}
      isAdmin={isAdmin}
      currentRange={range}
      weekOffset={weekOffset}
    />
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams
  const range = params.range || 'weekly'
  const weekOffset = params.week_offset ? parseInt(params.week_offset, 10) : 0

  // Check if user is admin (for download button)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const typedProfile = profile as { role: string } | null
    isAdmin = typedProfile?.role === 'admin'
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
            <p className="text-gray-600 mt-1">
              See how designers rank based on their submissions
            </p>
          </div>
          <TimeRangeToggle
            currentRange={range}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'last_business_day', label: 'Last Biz Day' },
              { value: 'all', label: 'Total' },
            ]}
          />
        </div>
        {range === 'weekly' && (
          <WeekNavigator weekOffset={weekOffset} />
        )}
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardData range={range} isAdmin={isAdmin} weekOffset={weekOffset} />
      </Suspense>
    </div>
  )
}
