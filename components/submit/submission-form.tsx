'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { ImageDropzone } from './image-dropzone'
import { ExistingAssets } from './existing-assets'
import { createSubmission } from '@/lib/actions/submissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Asset } from '@/lib/types/database'

interface SubmissionFormProps {
  userId: string
  hasSubmitted: boolean
  existingAssets: Asset[]
}

export function SubmissionForm({
  userId,
  hasSubmitted: initialHasSubmitted,
  existingAssets,
}: SubmissionFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(initialHasSubmitted)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleUploadComplete = (paths: string[]) => {
    startTransition(async () => {
      const result = await createSubmission(paths)
      if (result.error) {
        toast.error(result.error)
      } else {
        setHasSubmitted(true)
        setShowSuccess(true)
        toast.success('Submission uploaded successfully!')
        setTimeout(() => setShowSuccess(false), 3000)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Work</CardTitle>
        <CardDescription>
          Upload your design assets for today. You can add more files throughout the day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>Your assets have been submitted for review!</span>
          </div>
        )}

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
            You&apos;ve already submitted today. You can still add more assets above.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
