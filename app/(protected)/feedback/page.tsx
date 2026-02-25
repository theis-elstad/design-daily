export const runtime = 'edge'

import { Suspense } from 'react'
import { getMyFeedback, getMyLatestAISummary } from '@/lib/actions/feedback'
import { FeedbackPageClient } from '@/components/feedback/feedback-page-client'
import { FeedbackSkeleton } from '@/components/feedback/feedback-skeleton'

async function FeedbackContent() {
  const [{ rows, kpis }, aiSummary] = await Promise.all([
    getMyFeedback('all'),
    getMyLatestAISummary(),
  ])

  return (
    <FeedbackPageClient
      initialRows={rows}
      initialKpis={kpis}
      aiSummary={aiSummary}
    />
  )
}

export default function FeedbackPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Feedback</h1>
        <p className="text-gray-600 mt-1">
          Track your scores, view judge feedback, and get AI-powered insights
        </p>
      </div>

      <Suspense fallback={<FeedbackSkeleton />}>
        <FeedbackContent />
      </Suspense>
    </div>
  )
}
