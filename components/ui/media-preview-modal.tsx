'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface MediaItem {
  url: string
  name: string
  type: 'image' | 'video'
}

interface MediaPreviewModalProps {
  items: MediaItem[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function MediaPreviewModal({
  items,
  initialIndex,
  isOpen,
  onClose,
}: MediaPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, items.length])

  if (!isOpen || items.length === 0) return null

  const goToPrev = () => {
    setCurrentIndex(currentIndex === 0 ? items.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === items.length - 1 ? 0 : currentIndex + 1)
  }

  const currentItem = items[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {items.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            goToPrev()
          }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      <div
        className="max-w-4xl max-h-[80vh] px-16"
        onClick={(e) => e.stopPropagation()}
      >
        {currentItem.type === 'video' ? (
          <video
            key={currentItem.url}
            src={currentItem.url}
            controls
            autoPlay
            className="max-w-full max-h-[80vh] object-contain"
          />
        ) : (
          <img
            src={currentItem.url}
            alt={currentItem.name}
            className="max-w-full max-h-[80vh] object-contain"
          />
        )}
        <p className="text-center text-white mt-4 text-sm">
          {currentIndex + 1} of {items.length}
        </p>
      </div>

      {items.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>
  )
}

// Helper to determine if a file is a video based on extension or mime type
export function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
  const lowerName = fileName.toLowerCase()
  return videoExtensions.some((ext) => lowerName.endsWith(ext))
}
