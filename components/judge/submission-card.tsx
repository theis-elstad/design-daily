import Link from 'next/link'
import { format } from 'date-fns'
import { Image, Video, ChevronRight, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SubmissionCardProps {
  submission: {
    id: string
    submission_date: string
    submitterName: string
    comment?: string | null
    imageCount: number
    videoCount: number
    status: 'needs_review' | 'rated' | 'edited'
  }
}

function StatusBadge({ status }: { status: 'needs_review' | 'rated' | 'edited' }) {
  switch (status) {
    case 'rated':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 shrink-0">
          Rated
        </Badge>
      )
    case 'edited':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 shrink-0">
          Edited
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
          Needs Review
        </Badge>
      )
  }
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const date = new Date(submission.submission_date + 'T00:00:00')

  return (
    <Link href={`/judge/${submission.id}`}>
      <Card className="hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-medium text-gray-900 truncate">
                {submission.status === 'needs_review' ? 'Anonymous Designer' : submission.submitterName}
              </span>
              <StatusBadge status={submission.status} />
            </div>
            <p className="text-sm text-gray-500 mb-2">
              {format(date, 'MMM d, yyyy')}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {submission.imageCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5" />
                  {submission.imageCount} static
                </span>
              )}
              {submission.videoCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  {submission.videoCount} video
                </span>
              )}
              {submission.comment && (
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Note
                </span>
              )}
              {submission.imageCount === 0 && submission.videoCount === 0 && !submission.comment && (
                <span className="text-gray-400">No assets</span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 ml-4" />
        </CardContent>
      </Card>
    </Link>
  )
}
