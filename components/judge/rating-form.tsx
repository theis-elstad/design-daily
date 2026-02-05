'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { StarRating } from './star-rating'
import { submitRating } from '@/lib/actions/ratings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

interface RatingFormProps {
  submissionId: string
  initialRating?: {
    productivity: number
    quality: number
    convertability: number
  } | null
  onRated: () => void
}

export function RatingForm({
  submissionId,
  initialRating,
  onRated,
}: RatingFormProps) {
  const [productivity, setProductivity] = useState(initialRating?.productivity || 0)
  const [quality, setQuality] = useState(initialRating?.quality || 0)
  const [convertability, setConvertability] = useState(
    initialRating?.convertability || 0
  )
  const [isPending, startTransition] = useTransition()

  const canSubmit = productivity > 0 && quality > 0 && convertability > 0

  const handleSubmit = () => {
    if (!canSubmit) return

    startTransition(async () => {
      const result = await submitRating(submissionId, {
        productivity,
        quality,
        convertability,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Rating submitted!')
        onRated()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rate This Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Productivity
            <span className="text-gray-400 font-normal ml-2">
              Volume / Speed of output
            </span>
          </Label>
          <StarRating
            value={productivity}
            onChange={setProductivity}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Quality
            <span className="text-gray-400 font-normal ml-2">
              Overall craft and design quality
            </span>
          </Label>
          <StarRating value={quality} onChange={setQuality} disabled={isPending} />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Convertability
            <span className="text-gray-400 font-normal ml-2">
              Predicted ad conversion potential
            </span>
          </Label>
          <StarRating
            value={convertability}
            onChange={setConvertability}
            disabled={isPending}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
          className="w-full"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : initialRating ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Update Rating
            </>
          ) : (
            'Submit Rating'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
