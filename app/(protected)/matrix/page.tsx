export const runtime = 'edge'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { MatrixChart } from '@/components/matrix/matrix-chart'
import { TimeRangeToggle, type TimeRange } from '@/components/leaderboard/time-range-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import type { LeaderboardEntry } from '@/lib/types/database'

interface MatrixPageProps {
  searchParams: Promise<{ range?: TimeRange }>
}

async function MatrixData({ range }: { range: TimeRange }) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leaderboard } = await (supabase.rpc as any)('get_leaderboard', {
    time_range: range,
  })

  // Fetch avatar paths
  const userIds = (leaderboard || []).map((e: { user_id: string }) => e.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_path')
    .in('id', userIds)

  const avatarMap = new Map(
    (profiles || []).map((p: { id: string; avatar_path: string | null }) => [p.id, p.avatar_path])
  )

  const entries: LeaderboardEntry[] = (leaderboard || []).map(
    (entry: Omit<LeaderboardEntry, 'trend' | 'avatar_path'>) => ({
      ...entry,
      avatar_path: avatarMap.get(entry.user_id) || null,
    })
  )

  return <MatrixChart entries={entries} />
}

function MatrixSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4 sm:p-8">
      <Skeleton className="w-full aspect-square max-w-[700px] mx-auto rounded-lg" />
    </div>
  )
}

export default async function MatrixPage({ searchParams }: MatrixPageProps) {
  const params = await searchParams
  const range = params.range || 'week'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Matrix</h1>
            <p className="text-gray-600 mt-1">
              Productivity vs. Quality across all designers
            </p>
          </div>
          <TimeRangeToggle currentRange={range} basePath="/matrix" />
        </div>
      </div>

      <Suspense fallback={<MatrixSkeleton />}>
        <MatrixData range={range} />
      </Suspense>
    </div>
  )
}
