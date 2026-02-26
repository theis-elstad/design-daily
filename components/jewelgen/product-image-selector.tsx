'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import type { ShopifyProductImage } from '@/lib/types/jewelgen'

interface ProductImageSelectorProps {
  images: ShopifyProductImage[]
  productTitle: string
  selectedSrc: string | null
  onSelect: (src: string) => void
}

export function ProductImageSelector({
  images,
  productTitle,
  selectedSrc,
  onSelect,
}: ProductImageSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {productTitle} — {images.length} image{images.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((img) => {
          const isSelected = selectedSrc === img.src
          return (
            <button
              key={img.src}
              type="button"
              onClick={() => onSelect(img.src)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-lg border-2 transition-colors',
                isSelected ? 'border-primary' : 'border-transparent hover:border-border'
              )}
            >
              <img
                src={img.src}
                alt={img.alt || productTitle}
                className="h-full w-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                  <div className="rounded-full bg-primary p-1">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
