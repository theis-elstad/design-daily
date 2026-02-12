'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Image, Video, CheckCircle } from 'lucide-react'
import { SubmissionGallery } from './submission-gallery'
import { RatingForm } from './rating-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SubmissionDetailProps {
  submission: {
    id: string
    submission_date: string
    submitterName: string
    imageCount: number
    videoCount: number
    isRated: boolean
    myRating: {
      productivity: number
      quality: number
      convertability: number
    } | null
    assets: {
      id: string
      storage_path: string
      file_name: string
    }[]
  }
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  const router = useRouter()
  const date = new Date(submission.submission_date + 'T00:00:00')

  const handleRated = () => {
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{submission.submitterName}</h2>
          <p className="text-gray-500 mt-1">{format(date, 'EEEE, MMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          {submission.imageCount > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <Image className="h-3.5 w-3.5" />
              {submission.imageCount} static
            </Badge>
          )}
          {submission.videoCount > 0 && (
            <Badge variant="outline" className="gap-1.5">
              <Video className="h-3.5 w-3.5" />
              {submission.videoCount} video
            </Badge>
          )}
          {submission.isRated && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1">
              <CheckCircle className="h-3 w-3" />
              Rated
            </Badge>
          )}
        </div>
      </div>

      {/* Gallery + Rating Form */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Submission Assets ({submission.assets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionGallery assets={submission.assets} />
            </CardContent>
          </Card>
        </div>

        <div>
          <RatingForm
            submissionId={submission.id}
            initialRating={submission.myRating}
            onRated={handleRated}
          />
        </div>
      </div>
    </div>
  )
}
