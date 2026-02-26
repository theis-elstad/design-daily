'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Sparkles, BookmarkPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { resizeImageFile, fileToBase64 } from '@/lib/image-resize'
import { ReferenceLibraryBrowser } from './reference-library-browser'
import { SaveToLibraryDialog } from './save-to-library-dialog'
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
  const [removing, setRemoving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleRemoveJewelry = async () => {
    if (!referenceImage) return
    setRemoving(true)
    try {
      const res = await fetch(referenceImage.previewUrl)
      const blob = await res.blob()
      const file = new File([blob], 'reference.jpg', { type: 'image/jpeg' })
      const base64 = await fileToBase64(file)

      const removeRes = await fetch('/api/jewelgen/remove-jewelry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })
      const data = await removeRes.json()

      if (!removeRes.ok) {
        toast.error(data.error || 'Failed to remove jewelry')
        return
      }

      const resultBlob = new Blob(
        [Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      )
      const previewUrl = URL.createObjectURL(resultBlob)
      URL.revokeObjectURL(referenceImage.previewUrl)
      onReferenceImage({ path: data.path, previewUrl })
      toast.success('Jewelry removed')
    } catch {
      toast.error('Failed to remove jewelry')
    } finally {
      setRemoving(false)
    }
  }

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
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRemoveJewelry}
                disabled={removing}
              >
                {removing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                {removing ? 'Removing…' : 'Remove Jewelry'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(true)}
              >
                <BookmarkPlus className="mr-1.5 h-4 w-4" />
                Save to Library
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button onClick={onNext}>Continue</Button>
            </div>
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

      {referenceImage && (
        <SaveToLibraryDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          imagePreviewUrl={referenceImage.previewUrl}
        />
      )}
    </div>
  )
}
