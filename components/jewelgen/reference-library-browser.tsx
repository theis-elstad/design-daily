'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getRefCategories, getRefImages, getSignedUrl } from '@/lib/actions/jewelgen'
import type { JewelGenRefCategory, JewelGenRefImage } from '@/lib/types/jewelgen'

interface ReferenceLibraryBrowserProps {
  onSelect: (imageUrl: string) => void
}

export function ReferenceLibraryBrowser({ onSelect }: ReferenceLibraryBrowserProps) {
  const [categories, setCategories] = useState<JewelGenRefCategory[]>([])
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [images, setImages] = useState<JewelGenRefImage[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingImages, setLoadingImages] = useState(false)

  useEffect(() => {
    getRefCategories()
      .then((cats) => {
        setCategories(cats)
        if (cats.length > 0) {
          setSelectedParent(cats[0].id)
          if (cats[0].children && cats[0].children.length > 0) {
            setSelectedChild(cats[0].children[0].id)
          }
        }
      })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    if (!selectedChild) {
      setImages([])
      return
    }
    setLoadingImages(true)
    getRefImages(selectedChild)
      .then(async (imgs) => {
        setImages(imgs)
        // Load signed URLs
        const urls: Record<string, string> = {}
        await Promise.all(
          imgs.map(async (img) => {
            try {
              urls[img.id] = await getSignedUrl('jewelgen-references', img.storage_path)
            } catch {
              // skip
            }
          })
        )
        setImageUrls(urls)
      })
      .catch(() => toast.error('Failed to load images'))
      .finally(() => setLoadingImages(false))
  }, [selectedChild])

  const currentParent = categories.find((c) => c.id === selectedParent)

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No reference categories found. Add some in the Library page.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Parent categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedParent(cat.id)
              const firstChild = cat.children?.[0]
              setSelectedChild(firstChild?.id || null)
            }}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              selectedParent === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sub-categories */}
      {currentParent?.children && currentParent.children.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentParent.children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChild(child.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                selectedChild === child.id
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* Image grid */}
      {loadingImages ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No reference images in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => {
            const url = imageUrls[img.id]
            if (!url) return null
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => onSelect(url)}
                className="aspect-square overflow-hidden rounded-lg border hover:border-primary transition-colors"
              >
                <img
                  src={url}
                  alt={img.label || 'Reference'}
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
