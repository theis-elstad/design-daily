export const runtime = 'edge'

import { getSubmissionsForJudging, getJudgingStats } from '@/lib/actions/ratings'
import { JudgeSubmissionList } from '@/components/judge/judge-submission-list'
import { DatePicker } from '@/components/judge/date-picker'

interface JudgePageProps {
  searchParams: Promise<{ date?: string; tab?: string }>
}

export default async function JudgePage({ searchParams }: JudgePageProps) {
  const params = await searchParams
  const date = params.date // undefined means "all dates"
  const tab = params.tab || 'review'

  const [submissions, stats] = await Promise.all([
    getSubmissionsForJudging(date),
    getJudgingStats(date),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Judge Submissions</h1>
          <p className="text-gray-600 mt-1">
            {stats?.remaining ?? 0} submission{(stats?.remaining ?? 0) !== 1 ? 's' : ''} need{(stats?.remaining ?? 0) === 1 ? 's' : ''} your review
          </p>
        </div>
        <DatePicker currentDate={date} />
      </div>

      <JudgeSubmissionList
        submissions={submissions}
        initialTab={tab}
      />
    </div>
  )
}
