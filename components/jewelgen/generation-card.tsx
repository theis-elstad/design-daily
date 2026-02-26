'use client'

import { useState } from 'react'
import { Download, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GenerationCardProps {
  base64: string
  mimeType: string
  path: string
  index: number
  onEdit: (base64: string, mimeType: string, comment: string) => Promise<void>
}

export function GenerationCard({
  base64,
  mimeType,
  path,
  index,
  onEdit,
}: GenerationCardProps) {
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `data:${mimeType};base64,${base64}`
    link.download = `jewelgen-${index + 1}.${mimeType.includes('png') ? 'png' : 'jpg'}`
    link.click()
  }

  const handleEdit = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await onEdit(base64, mimeType, comment.trim())
      setComment('')
      setEditing(false)
    } catch {
      toast.error('Edit failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <img
          src={`data:${mimeType};base64,${base64}`}
          alt={`Generated result ${index + 1}`}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setEditing(!editing)}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
      {editing && (
        <div className="flex gap-2">
          <Input
            placeholder="Describe your edit..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            disabled={submitting}
          />
          <Button
            size="sm"
            onClick={handleEdit}
            disabled={submitting || !comment.trim()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
          </Button>
        </div>
      )}
    </div>
  )
}
