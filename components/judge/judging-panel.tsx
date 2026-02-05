'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { SubmissionGallery } from './submission-gallery'
import { RatingForm } from './rating-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface JudgingAsset {
  id: string
  storage_path: string
  file_name: string
}

interface Submission {
  id: string
  submission_date: string
  user_id: string
  assets: JudgingAsset[]
  isRated: boolean
  myRating: {
    productivity: number
    quality: number
    convertability: number
  } | null
}

interface JudgingPanelProps {
  submissions: Submission[]
  stats: {
    total: number
    rated: number
    remaining: number
  }
}

export function JudgingPanel({ submissions, stats }: JudgingPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localSubmissions, setLocalSubmissions] = useState(submissions)

  const currentSubmission = localSubmissions[currentIndex]

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? localSubmissions.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === localSubmissions.length - 1 ? 0 : prev + 1))
  }

  const handleRated = () => {
    // Update local state to mark as rated
    setLocalSubmissions((prev) =>
      prev.map((sub, idx) =>
        idx === currentIndex ? { ...sub, isRated: true } : sub
      )
    )
  }

  if (localSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-xl font-semibold mb-2">No Submissions to Judge</h2>
        <p className="text-gray-500">
          There are no submissions for this date yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Submission {currentIndex + 1} of {localSubmissions.length}
          </span>
          {currentSubmission.isRated && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Rated
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {stats.rated} / {stats.total} rated
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2">
        {localSubmissions.map((sub, idx) => (
          <button
            key={sub.id}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              idx === currentIndex
                ? 'bg-blue-500'
                : sub.isRated
                ? 'bg-green-400'
                : 'bg-gray-300 hover:bg-gray-400'
            )}
            aria-label={`Go to submission ${idx + 1}`}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Submission Assets ({currentSubmission.assets.length})</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={goToPrev}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionGallery assets={currentSubmission.assets} />
            </CardContent>
          </Card>
        </div>

        {/* Rating Form */}
        <div>
          <RatingForm
            key={currentSubmission.id}
            submissionId={currentSubmission.id}
            initialRating={currentSubmission.myRating}
            onRated={handleRated}
          />
        </div>
      </div>
    </div>
  )
}
