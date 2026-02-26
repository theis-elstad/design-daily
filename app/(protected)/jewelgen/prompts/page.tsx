'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getPrompts, updatePrompt } from '@/lib/actions/jewelgen'
import type { JewelGenPrompt } from '@/lib/types/jewelgen'

export default function JewelGenPromptsPage() {
  const [prompts, setPrompts] = useState<JewelGenPrompt[]>([])
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrompts()
  }, [])

  async function loadPrompts() {
    try {
      const data = await getPrompts()
      setPrompts(data)
      // Initialize edited content with current values
      const initial: Record<string, string> = {}
      for (const p of data) {
        initial[p.id] = p.content
      }
      setEditedContent(initial)
    } catch (err) {
      toast.error('Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  function isDirty(prompt: JewelGenPrompt): boolean {
    return editedContent[prompt.id] !== prompt.content
  }

  async function handleSave(prompt: JewelGenPrompt) {
    const content = editedContent[prompt.id]
    if (!content || content === prompt.content) return

    setSaving((prev) => ({ ...prev, [prompt.id]: true }))
    try {
      await updatePrompt(prompt.id, content)
      // Update the local prompt state to reflect the save
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === prompt.id
            ? { ...p, content, updated_at: new Date().toISOString() }
            : p
        )
      )
      toast.success(`"${prompt.title}" prompt saved`)
    } catch (err) {
      toast.error('Failed to save prompt')
    } finally {
      setSaving((prev) => ({ ...prev, [prompt.id]: false }))
    }
  }

  function handleDiscard(prompt: JewelGenPrompt) {
    setEditedContent((prev) => ({ ...prev, [prompt.id]: prompt.content }))
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="text-center text-muted-foreground">Loading prompts…</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/jewelgen/new">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Prompt Templates</h1>
          <p className="text-sm text-muted-foreground">
            Edit the AI prompts used by JewelGen. Changes apply to all future
            generations.
          </p>
        </div>
      </div>

      {/* Prompt Cards */}
      {prompts.map((prompt) => (
        <Card key={prompt.id}>
          <CardHeader>
            <CardTitle className="text-lg">{prompt.title}</CardTitle>
            {prompt.description && (
              <p className="text-sm text-muted-foreground">{prompt.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <Textarea
              value={editedContent[prompt.id] || ''}
              onChange={(e) =>
                setEditedContent((prev) => ({
                  ...prev,
                  [prompt.id]: e.target.value,
                }))
              }
              className="min-h-[200px] font-mono text-sm"
              placeholder="Enter prompt template…"
            />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Last updated: {formatDate(prompt.updated_at)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDiscard(prompt)}
                disabled={!isDirty(prompt)}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(prompt)}
                disabled={!isDirty(prompt) || saving[prompt.id]}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving[prompt.id] ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
