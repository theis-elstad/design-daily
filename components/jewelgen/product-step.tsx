'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Loader2, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { resizeImageFile, fileToBase64 } from '@/lib/image-resize'
import { ShopifyUrlInput } from './shopify-url-input'
import { ProductImageSelector } from './product-image-selector'
import type { ProductImage, ShopifyProductImage } from '@/lib/types/jewelgen'

interface ProductStepProps {
  productImage: ProductImage | null
  onProductImage: (img: ProductImage | null) => void
  onNext: () => void
}

export function ProductStep({
  productImage,
  onProductImage,
  onNext,
}: ProductStepProps) {
  const [fixing, setFixing] = useState(false)
  const [shopifyImages, setShopifyImages] = useState<ShopifyProductImage[]>([])
  const [productTitle, setProductTitle] = useState('')
  const [selectedShopifySrc, setSelectedShopifySrc] = useState<string | null>(null)
  const [loadingShopify, setLoadingShopify] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const resized = await resizeImageFile(file)
        const previewUrl = URL.createObjectURL(resized)
        onProductImage({ path: '', previewUrl })
      } catch {
        toast.error('Failed to process image')
      }
    },
    [onProductImage]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  })

  const handleShopifySelect = async (src: string) => {
    setSelectedShopifySrc(src)
    setLoadingShopify(true)
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const previewUrl = URL.createObjectURL(blob)
      onProductImage({ path: src, previewUrl })
    } catch {
      toast.error('Failed to load image')
    } finally {
      setLoadingShopify(false)
    }
  }

  const handleFix = async () => {
    if (!productImage) return
    setFixing(true)
    try {
      // Convert current preview to base64
      const res = await fetch(productImage.previewUrl)
      const blob = await res.blob()
      const file = new File([blob], 'product.jpg', { type: 'image/jpeg' })
      const base64 = await fileToBase64(file)

      const fixRes = await fetch('/api/jewelgen/fix-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg' }),
      })

      const data = await fixRes.json()
      if (!fixRes.ok) {
        toast.error(data.error || 'Fix failed')
        return
      }

      // Update with fixed image
      const fixedBlob = new Blob(
        [Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0))],
        { type: data.mimeType }
      )
      const previewUrl = URL.createObjectURL(fixedBlob)
      // Revoke old URL
      URL.revokeObjectURL(productImage.previewUrl)
      onProductImage({ path: data.path, previewUrl })
      toast.success('Image cleaned up')
    } catch {
      toast.error('Failed to fix image')
    } finally {
      setFixing(false)
    }
  }

  const clearImage = () => {
    if (productImage) {
      URL.revokeObjectURL(productImage.previewUrl)
      onProductImage(null)
    }
    setSelectedShopifySrc(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Product Image</h2>
        <p className="text-sm text-muted-foreground">
          Upload a photo of your jewelry or fetch from a Shopify product page.
        </p>
      </div>

      {productImage ? (
        <div className="space-y-4">
          <div className="relative mx-auto max-w-sm">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={productImage.previewUrl}
                alt="Product"
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
            <Button
              variant="outline"
              onClick={handleFix}
              disabled={fixing}
            >
              {fixing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {fixing ? 'Cleaning...' : 'Clean Background'}
            </Button>
            <Button onClick={onNext}>Continue</Button>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="shopify">Shopify URL</TabsTrigger>
          </TabsList>
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
                  : 'Drag & drop a product image, or click to select'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                JPEG, PNG, or WebP up to 20MB
              </p>
            </div>
          </TabsContent>
          <TabsContent value="shopify" className="mt-4 space-y-4">
            <ShopifyUrlInput
              onImagesLoaded={(images, title) => {
                setShopifyImages(images)
                setProductTitle(title)
              }}
            />
            {shopifyImages.length > 0 && (
              <ProductImageSelector
                images={shopifyImages}
                productTitle={productTitle}
                selectedSrc={selectedShopifySrc}
                onSelect={handleShopifySelect}
              />
            )}
            {loadingShopify && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading image...</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
