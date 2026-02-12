export const runtime = 'edge'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LeaderboardPodium } from '@/components/leaderboard/leaderboard-podium'
import { TimeRangeToggle, type TimeRange } from '@/components/leaderboard/time-range-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import type { LeaderboardEntry } from '@/lib/types/database'

interface LeaderboardPageProps {
  searchParams: Promise<{ range?: TimeRange }>
}

async function LeaderboardData({
  range,
  isAdmin,
}: {
  range: TimeRange
  isAdmin: boolean
}) {
  const supabase = await createClient()

  // Get current period leaderboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentLeaderboard } = await (supabase.rpc as any)('get_leaderboard', {
    time_range: range,
  })

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
  type RawLeaderboardEntry = Omit<LeaderboardEntry, 'trend' | 'avatar_path'>
  const current: RawLeaderboardEntry[] = currentLeaderboard || []
  const previous: RawLeaderboardEntry[] = previousLeaderboard || []

  // Calculate trends by comparing ranks and add avatar paths
  const leaderboardWithTrends: LeaderboardEntry[] = current.map((entry) => {
    const previousEntry = previous.find((p) => p.user_id === entry.user_id)

    let trend: 'up' | 'down' | 'same' = 'same'
    if (previousEntry) {
      if (entry.rank < previousEntry.rank) trend = 'up'
      else if (entry.rank > previousEntry.rank) trend = 'down'
    }

    return { ...entry, trend, avatar_path: avatarMap.get(entry.user_id) || null }
  })

  return <LeaderboardPodium entries={leaderboardWithTrends} isAdmin={isAdmin} />
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
  const range = params.range || 'week'

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
          <TimeRangeToggle currentRange={range} />
        </div>
      </div>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardData range={range} isAdmin={isAdmin} />
      </Suspense>
    </div>
  )
}
