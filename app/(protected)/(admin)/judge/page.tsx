export const runtime = 'edge'

import { getSubmissionsForJudging, getJudgingStats } from '@/lib/actions/ratings'
import { JudgingPanel } from '@/components/judge/judging-panel'
import { DatePicker } from '@/components/judge/date-picker'

interface JudgePageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function JudgePage({ searchParams }: JudgePageProps) {
  const params = await searchParams
  const date = params.date || new Date().toISOString().split('T')[0]

  const [submissions, stats] = await Promise.all([
    getSubmissionsForJudging(date),
    getJudgingStats(date),
  ])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Judge Submissions</h1>
          <p className="text-gray-600 mt-1">
            Rate submissions anonymously on three dimensions
          </p>
        </div>
        <DatePicker currentDate={date} />
      </div>

      <JudgingPanel
        submissions={submissions}
        stats={stats || { total: 0, rated: 0, remaining: 0 }}
      />
    </div>
  )
}
