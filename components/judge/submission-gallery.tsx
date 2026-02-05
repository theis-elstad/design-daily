'use client'

import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  MediaPreviewModal,
  isVideoFile,
  type MediaItem,
} from '@/components/ui/media-preview-modal'

interface GalleryAsset {
  id: string
  storage_path: string
  file_name: string
}

interface SubmissionGalleryProps {
  assets: GalleryAsset[]
}

export function SubmissionGallery({ assets }: SubmissionGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const supabase = createClient()

  // Generate signed URLs for all assets on mount
  useEffect(() => {
    async function getSignedUrls() {
      const urls: Record<string, string> = {}
      for (const asset of assets) {
        const { data } = await supabase.storage
          .from('submissions')
          .createSignedUrl(asset.storage_path, 3600) // 1 hour expiry
        if (data?.signedUrl) {
          urls[asset.storage_path] = data.signedUrl
        }
      }
      setSignedUrls(urls)
    }
    if (assets.length > 0) {
      getSignedUrls()
    }
  }, [assets, supabase])

  const getMediaUrl = (storagePath: string) => {
    return signedUrls[storagePath] || ''
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No assets in this submission
      </div>
    )
  }

  const mediaItems: MediaItem[] = assets.map((asset) => ({
    url: getMediaUrl(asset.storage_path),
    name: asset.file_name,
    type: isVideoFile(asset.file_name) ? 'video' : 'image',
  }))

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {assets.map((asset, index) => {
          const isVideo = isVideoFile(asset.file_name)
          const mediaUrl = getMediaUrl(asset.storage_path)

          return (
            <button
              key={asset.id}
              onClick={() => mediaUrl && setSelectedIndex(index)}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-blue-500 transition-all relative"
            >
              {mediaUrl && (
                <>
                  {isVideo ? (
                    <>
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                          <Play className="h-6 w-6 text-white ml-1" fill="white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
              )}
            </button>
          )
        })}
      </div>

      <MediaPreviewModal
        items={mediaItems}
        initialIndex={selectedIndex ?? 0}
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
      />
    </>
  )
}
