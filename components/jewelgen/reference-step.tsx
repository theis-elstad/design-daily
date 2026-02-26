'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { resizeImageFile } from '@/lib/image-resize'
import { ReferenceLibraryBrowser } from './reference-library-browser'
import type { ProductImage } from '@/lib/types/jewelgen'

interface ReferenceStepProps {
  referenceImage: ProductImage | null
  onReferenceImage: (img: ProductImage | null) => void
  onNext: () => void
  onBack: () => void
}

export function ReferenceStep({
  referenceImage,
  onReferenceImage,
  onNext,
  onBack,
}: ReferenceStepProps) {
  const handleFile = useCallback(
    async (file: File) => {
      try {
        const resized = await resizeImageFile(file)
        const previewUrl = URL.createObjectURL(resized)
        onReferenceImage({ path: '', previewUrl })
      } catch {
        toast.error('Failed to process image')
      }
    },
    [onReferenceImage]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handleLibrarySelect = async (imageUrl: string) => {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const previewUrl = URL.createObjectURL(blob)
      onReferenceImage({ path: imageUrl, previewUrl })
    } catch {
      toast.error('Failed to load reference image')
    }
  }

  const clearImage = () => {
    if (referenceImage) {
      URL.revokeObjectURL(referenceImage.previewUrl)
      onReferenceImage(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reference Image</h2>
        <p className="text-sm text-muted-foreground">
          Choose a style reference — the generated ad will match this look and feel.
        </p>
      </div>

      {referenceImage ? (
        <div className="space-y-4">
          <div className="relative mx-auto max-w-sm">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={referenceImage.previewUrl}
                alt="Reference"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onNext}>Continue</Button>
          </div>
        </div>
      ) : (
        <>
          <Tabs defaultValue="library">
            <TabsList>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="mt-4">
              <ReferenceLibraryBrowser onSelect={handleLibrarySelect} />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop image here...'
                    : 'Drag & drop a reference image, or click to select'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  JPEG, PNG, or WebP up to 20MB
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-start">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
