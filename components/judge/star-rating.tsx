'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  maxStars?: number
  disabled?: boolean
}

export function StarRating({
  value,
  onChange,
  maxStars = 3,
  disabled = false,
}: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={cn(
            'p-1 transition-colors rounded',
            !disabled && 'hover:bg-gray-100 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
