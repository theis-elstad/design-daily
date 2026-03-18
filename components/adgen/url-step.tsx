'use client'

import { useState } from 'react'
import { Sparkles, Globe, ShoppingBag, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { detectUrlType, type UrlType } from '@/lib/types/adgen'

interface UrlStepProps {
  onSubmit: (url: string) => void
}

function isValidUrl(str: string): boolean {
  if (!str.trim()) return false
  try {
    new URL(str.startsWith('http') ? str : `https://${str}`)
    return true
  } catch {
    return false
  }
}

const URL_TYPE_CONFIG: Record<UrlType, { label: string; icon: typeof Globe; description: string }> = {
  brand: { label: 'Brand', icon: Globe, description: 'Brand-level research — no product images will be fetched' },
  collection: { label: 'Collection', icon: LayoutGrid, description: 'Collection research with product images from the collection' },
  product: { label: 'Product', icon: ShoppingBag, description: 'Product research with product images' },
}

export function UrlStep({ onSubmit }: UrlStepProps) {
  const [url, setUrl] = useState('')

  const valid = isValidUrl(url.trim())
  const normalizedUrl = url.trim().startsWith('http')
    ? url.trim()
    : `https://${url.trim()}`

  const detectedType = valid ? detectUrlType(normalizedUrl) : null
  const config = detectedType ? URL_TYPE_CONFIG[detectedType] : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Enter URL</h2>
        <p className="text-sm text-muted-foreground">
          Paste a product, collection, or brand URL to get started.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="https://brand.com, .../collections/..., or .../products/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && valid) onSubmit(normalizedUrl)
          }}
          className="text-base"
          autoFocus
        />
        {config && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="gap-1 text-xs">
              <config.icon className="h-3 w-3" />
              {config.label}
            </Badge>
            <span>{config.description}</span>
          </div>
        )}
        <Button
          onClick={() => onSubmit(normalizedUrl)}
          disabled={!valid}
          className="w-full"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Continue
        </Button>
      </div>
    </div>
  )
}
