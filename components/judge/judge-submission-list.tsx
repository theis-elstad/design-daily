'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SubmissionCard } from './submission-card'
import { CheckCircle, Clock } from 'lucide-react'

interface Submission {
  id: string
  submission_date: string
  submitterName: string
  comment?: string | null
  imageCount: number
  videoCount: number
  isRated: boolean
}

interface JudgeSubmissionListProps {
  submissions: Submission[]
  initialTab: string
}

export function JudgeSubmissionList({ submissions, initialTab }: JudgeSubmissionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const needsReview = submissions.filter((s) => !s.isRated)
  const completed = submissions.filter((s) => s.isRated)

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'review') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(`/judge${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <Tabs defaultValue={initialTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="review" className="gap-2">
          <Clock className="h-4 w-4" />
          Needs Review ({needsReview.length})
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Completed ({completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="review">
        {needsReview.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
            <p className="text-gray-500">No submissions need your review right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {needsReview.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completed.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No completed reviews</h3>
            <p className="text-gray-500">Submissions you review will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
