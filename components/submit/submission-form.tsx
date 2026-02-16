'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, Loader2, Save, CalendarOff } from 'lucide-react'
import { ImageDropzone } from './image-dropzone'
import { ExistingAssets } from './existing-assets'
import { createSubmission, updateComment } from '@/lib/actions/submissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Asset } from '@/lib/types/database'

interface SubmissionFormProps {
  userId: string
  hasSubmitted: boolean
  existingAssets: Asset[]
  existingComment?: string | null
  submissionId?: string | null
  selectedDate: string
  isWeekend?: boolean
}

export function SubmissionForm({
  userId,
  hasSubmitted: initialHasSubmitted,
  existingAssets: initialExistingAssets,
  existingComment: initialComment,
  submissionId: initialSubmissionId,
  selectedDate,
  isWeekend = false,
}: SubmissionFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted)
  const [existingAssets, setExistingAssets] = useState(initialExistingAssets)
  const [comment, setComment] = useState(initialComment || '')
  const [savedComment, setSavedComment] = useState(initialComment || '')
  const [submissionId, setSubmissionId] = useState(initialSubmissionId)
  const [isPending, startTransition] = useTransition()
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Reset state when date changes
  useEffect(() => {
    setHasSubmitted(initialHasSubmitted)
    setExistingAssets(initialExistingAssets)
    setComment(initialComment || '')
    setSavedComment(initialComment || '')
    setSubmissionId(initialSubmissionId)
    setShowSuccess(false)
  }, [selectedDate, initialHasSubmitted, initialExistingAssets, initialComment, initialSubmissionId])

  const commentChanged = comment !== savedComment

  const handleUploadComplete = (paths: string[]) => {
    startTransition(async () => {
      const result = await createSubmission(paths, selectedDate, comment)
      if (result.error) {
        toast.error(result.error)
      } else {
        setHasSubmitted(true)
        setSavedComment(comment)
        if (result.submissionId) {
          setSubmissionId(result.submissionId)
        }
        setShowSuccess(true)
        toast.success('Submission uploaded successfully!')
        setTimeout(() => setShowSuccess(false), 3000)
      }
    })
  }

  const handleSaveComment = async () => {
    if (!submissionId || !commentChanged) return

    setIsSavingComment(true)
    try {
      const result = await updateComment(submissionId, comment)
      if (result.error) {
        toast.error(result.error)
      } else {
        setSavedComment(comment)
        toast.success('Comment saved!')
      }
    } finally {
      setIsSavingComment(false)
    }
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  if (isWeekend) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center gap-3">
            <CalendarOff className="h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900">No Weekend Submissions</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Submissions are only accepted on weekdays (Monday–Friday). Please select a weekday to submit your work.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Work</CardTitle>
        <CardDescription>
          {isToday
            ? 'Upload your design assets for today. You can add more files throughout the day.'
            : `Upload design assets for ${new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>Your assets have been submitted for review!</span>
          </div>
        )}

        {/* Comment section */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium">
            Comment
            <span className="text-gray-400 font-normal ml-2">Optional</span>
          </Label>
          <Textarea
            id="comment"
            placeholder="Add a note about today's work..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            disabled={isPending || isSavingComment}
            className="resize-none"
          />
          {hasSubmitted && commentChanged && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveComment}
              disabled={isSavingComment}
              className="mt-1"
            >
              {isSavingComment ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-3.5 w-3.5" />
                  Save Comment
                </>
              )}
            </Button>
          )}
        </div>

        {hasSubmitted && existingAssets.length > 0 && (
          <ExistingAssets assets={existingAssets} />
        )}

        <ImageDropzone
          userId={userId}
          onUploadComplete={handleUploadComplete}
          disabled={isPending}
        />

        {hasSubmitted && (
          <p className="text-sm text-gray-500 text-center">
            {isToday
              ? "You've already submitted today. You can still add more assets above."
              : 'You have existing submissions for this date. You can add more assets above.'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
