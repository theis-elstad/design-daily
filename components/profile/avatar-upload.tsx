'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Loader2, Camera, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAvatar } from '@/lib/actions/users'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string
  children: React.ReactNode
}

export function AvatarUpload({ userId, currentAvatarUrl, children }: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const extension = selectedFile.name.split('.').pop() || 'jpg'
      const fileName = `${userId}/avatar.${extension}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          upsert: true, // Replace existing avatar
        })

      if (uploadError) {
        throw uploadError
      }

      // Update profile with new avatar path
      const result = await updateProfileAvatar(fileName)

      if (result.error) {
        throw new Error(result.error)
      }

      toast.success('Profile picture updated!')
      setIsOpen(false)
      setPreview(null)
      setSelectedFile(null)

      // Force a page reload to show the new avatar
      window.location.reload()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setPreview(null)
    setSelectedFile(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture. It will appear in the header and on the leaderboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {preview ? (
            <div className="relative">
              <div className="aspect-square w-full max-w-[200px] mx-auto rounded-full overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={clearSelection}
                className="absolute top-0 right-1/2 translate-x-[100px] -translate-y-2 p-1 bg-red-500 text-white rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              `}
            >
              <input {...getInputProps()} />
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600">Drop your image here...</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-1">
                    Drag & drop an image, or click to select
                  </p>
                  <p className="text-sm text-gray-400">
                    JPEG, PNG, GIF, WebP up to 5MB
                  </p>
                </>
              )}
            </div>
          )}

          {currentAvatarUrl && !preview && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Current picture:</p>
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100">
                <img
                  src={currentAvatarUrl}
                  alt="Current avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
