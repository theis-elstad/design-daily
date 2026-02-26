'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { resizeImageBlob } from '@/lib/image-resize'
import { createClient } from '@/lib/supabase/client'
import {
  getRefCategories,
  createRefCategory,
  createRefImage,
} from '@/lib/actions/jewelgen'
import type { JewelGenRefCategory } from '@/lib/types/jewelgen'

interface SaveToLibraryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imagePreviewUrl: string
}

export function SaveToLibraryDialog({
  open,
  onOpenChange,
  imagePreviewUrl,
}: SaveToLibraryDialogProps) {
  const [categories, setCategories] = useState<JewelGenRefCategory[]>([])
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    if (!open) return
    setLoadingCategories(true)
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
  }, [open])

  const currentParent = categories.find((c) => c.id === selectedParent)

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedParent) return
    setCreatingFolder(true)
    try {
      const newCat = await createRefCategory(newFolderName.trim(), selectedParent)
      // Update local state
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedParent
            ? { ...cat, children: [...(cat.children || []), newCat] }
            : cat
        )
      )
      setSelectedChild(newCat.id)
      setNewFolderName('')
    } catch {
      toast.error('Failed to create folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleSave = async () => {
    if (!selectedChild) {
      toast.error('Please select a folder')
      return
    }

    setSaving(true)
    try {
      // Fetch the image blob from the preview URL
      const res = await fetch(imagePreviewUrl)
      const blob = await res.blob()

      // Resize for consistency
      const resized = await resizeImageBlob(blob, 'reference.jpg')

      // Upload to Supabase Storage
      const supabase = createClient()
      const filePath = `${selectedChild}/${Date.now()}-reference.jpg`

      const { error: uploadError } = await supabase.storage
        .from('jewelgen-references')
        .upload(filePath, resized, { contentType: 'image/jpeg' })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      // Create DB record
      await createRefImage(selectedChild, filePath)

      toast.success('Saved to library')
      onOpenChange(false)
    } catch {
      toast.error('Failed to save to library')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Library</DialogTitle>
          <DialogDescription>
            Choose a folder to save this reference image.
          </DialogDescription>
        </DialogHeader>

        {loadingCategories ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No categories found. Create some in the Library page first.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Parent categories */}
            <div>
              <p className="mb-2 text-sm font-medium">Category</p>
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
            </div>

            {/* Sub-categories */}
            {currentParent && (
              <div>
                <p className="mb-2 text-sm font-medium">Folder</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentParent.children?.map((child) => (
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

                {/* New folder inline */}
                <div className="mt-3 flex gap-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder()
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || creatingFolder}
                  >
                    {creatingFolder ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedChild || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
