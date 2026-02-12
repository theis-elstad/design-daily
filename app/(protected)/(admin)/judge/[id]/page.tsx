export const runtime = 'edge'

import { notFound } from 'next/navigation'
import { getSubmissionForJudgingById } from '@/lib/actions/ratings'
import { SubmissionDetail } from '@/components/judge/submission-detail'
import { BackButton } from '@/components/judge/back-button'

interface SubmissionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { id } = await params
  const submission = await getSubmissionForJudgingById(id)

  if (!submission) {
    notFound()
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <SubmissionDetail submission={submission} />
    </div>
  )
}
