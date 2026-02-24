'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, X, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MediaPreviewModal,
  isVideoFile,
  type MediaItem,
} from '@/components/ui/media-preview-modal'

interface UploadedFile {
  path: string
  name: string
  previewUrl: string
  type: 'image' | 'video'
}

interface ImageDropzoneProps {
  userId: string
  onUploadComplete: (paths: string[]) => void
  disabled?: boolean
}

export function ImageDropzone({
  userId,
  onUploadComplete,
  disabled = false,
}: ImageDropzoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const supabase = createClient()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || uploading) return

      setUploading(true)
      setProgress(0)
      const newFiles: UploadedFile[] = []

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${i}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error } = await supabase.storage
          .from('submissions')
          .upload(filePath, file)

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
        } else {
          const previewUrl = URL.createObjectURL(file)
          const isVideo = file.type.startsWith('video/')
          newFiles.push({
            path: filePath,
            name: file.name,
            previewUrl,
            type: isVideo ? 'video' : 'image',
          })
        }

        setProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
      }

      setUploadedFiles((prev) => [...prev, ...newFiles])
      setUploading(false)
      setProgress(0)
    },
    [userId, supabase, disabled, uploading]
  )

  const removeFile = async (index: number) => {
    const file = uploadedFiles[index]
    await supabase.storage.from('submissions').remove([file.path])
    URL.revokeObjectURL(file.previewUrl)
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const paths = uploadedFiles.map((f) => f.path)
    onUploadComplete(paths)
    // Clean up preview URLs
    uploadedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setUploadedFiles([])
  }

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) => {
      const isTooLarge = errors.some((e) => e.code === 'file-too-large')
      if (isTooLarge) {
        toast.error(`${file.name} exceeds the 50MB limit. Please create a lower quality version for upload.`)
        return
      }
      const reasons = errors.map((e) => {
        if (e.code === 'file-invalid-type') return 'Unsupported file type'
        return e.message
      }).join(', ')
      toast.error(`${file.name}: ${reasons}`)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB limit (Supabase free tier)
    disabled: disabled || uploading,
  })

  const mediaItems: MediaItem[] = uploadedFiles.map((f) => ({
    url: f.previewUrl,
    name: f.name,
    type: f.type,
  }))

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          (disabled || uploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-600">Uploading... {progress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop images or videos here, or click to select'}
            </p>
            <p className="text-xs text-gray-400">
              Supports: JPEG, PNG, GIF, WebP, MP4, WebM, MOV
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded ({uploadedFiles.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file, index) => (
              <div
                key={file.path}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setPreviewIndex(index)}
              >
                {file.type === 'video' ? (
                  <>
                    <video
                      src={file.previewUrl}
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
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={disabled}>
            Submit {uploadedFiles.length} asset{uploadedFiles.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}

      <MediaPreviewModal
        items={mediaItems}
        initialIndex={previewIndex ?? 0}
        isOpen={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
      />
    </div>
  )
}
