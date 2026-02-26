'use client'

import { useState } from 'react'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ShopifyProductImage } from '@/lib/types/jewelgen'

interface ShopifyUrlInputProps {
  onImagesLoaded: (images: ShopifyProductImage[], title: string) => void
}

export function ShopifyUrlInput({ onImagesLoaded }: ShopifyUrlInputProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!url.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/jewelgen/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to fetch product')
        return
      }

      if (data.images.length === 0) {
        toast.error('No suitable images found for this product')
        return
      }

      onImagesLoaded(data.images, data.title)
    } catch {
      toast.error('Failed to fetch product data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="https://store.myshopify.com/products/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
          className="pl-9"
          disabled={loading}
        />
      </div>
      <Button onClick={handleFetch} disabled={loading || !url.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
      </Button>
    </div>
  )
}
