'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, RotateCcw, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { deleteApp, restoreApp, reorderApps } from '@/lib/actions/apps'
import { AdminAppForm } from '@/components/apps/admin-app-form'
import { cn, getLetterAvatarColor } from '@/lib/utils'
import type { App } from '@/lib/types/database'

interface AdminAppListProps {
  apps: App[]
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    active: 'default',
    beta: 'outline',
    maintenance: 'secondary',
    hidden: 'destructive',
  }
  return (
    <Badge variant={variants[status] || 'secondary'} className="capitalize">
      {status}
    </Badge>
  )
}

export function AdminAppList({ apps: initialApps }: AdminAppListProps) {
  const [apps, setApps] = useState(initialApps)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<App | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeApps = apps.filter((a) => !a.deleted_at)
  const deletedApps = apps.filter((a) => a.deleted_at)

  const handleSaved = () => {
    startTransition(() => {
      window.location.reload()
    })
  }

  const handleDelete = async () => {
    if (!deleteConfirmApp) return
    const result = await deleteApp(deleteConfirmApp.id)
    if (result.success) {
      setDeleteConfirmApp(null)
      window.location.reload()
    }
  }

  const handleRestore = async (id: string) => {
    const result = await restoreApp(id)
    if (result.success) {
      window.location.reload()
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= activeApps.length) return

    const reordered = [...activeApps]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    setApps([...reordered, ...deletedApps])
    await reorderApps(reordered.map((a) => a.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Apps ({activeApps.length})</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingApp(null)
            setFormOpen(true)
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add App
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>App</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeApps.map((app, index) => (
            <TableRow key={app.id}>
              <TableCell className="font-mono text-xs text-gray-500">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt=""
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
                        getLetterAvatarColor(app.name)
                      )}
                    >
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-xs text-gray-500">{app.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span className="max-w-[200px] truncate">{app.url}</span>
                  {app.open_in_new_tab && <ExternalLink className="h-3 w-3 shrink-0" />}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={app.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === activeApps.length - 1}
                    onClick={() => handleMove(index, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingApp(app)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={() => setDeleteConfirmApp(app)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {deletedApps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500">
            Deleted ({deletedApps.length})
          </h4>
          <Table>
            <TableBody>
              {deletedApps.map((app) => (
                <TableRow key={app.id} className="opacity-50">
                  <TableCell>
                    <span className="font-medium">{app.name}</span>
                    <span className="ml-2 text-xs text-gray-400">({app.slug})</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(app.id)}
                    >
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AdminAppForm
        app={editingApp}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteConfirmApp} onOpenChange={() => setDeleteConfirmApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirmApp?.name}&rdquo;? It will be
              hidden from the hub but can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmApp(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
