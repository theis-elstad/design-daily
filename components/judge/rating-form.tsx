'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { StarRating } from './star-rating'
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
  const [isPending, setIsPending] = useState(false)

  const canSubmit = productivity > 0 && quality > 0 && convertability > 0

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsPending(true)
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          ratings: {
            productivity,
            quality,
            convertability,
          },
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        toast.error(result.error || 'Failed to submit rating')
      } else {
        toast.success('Rating submitted!')
        onRated()
      }
    } catch {
      toast.error('Failed to submit rating. Please try again.')
    } finally {
      setIsPending(false)
    }
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
