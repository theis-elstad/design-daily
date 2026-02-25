'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, User } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DesignerSummary {
  designerId: string
  designerName: string
  summary: {
    id: string
    content: string
    createdAt: string
  } | null
}

interface AIFeedbackListProps {
  initialSummaries: DesignerSummary[]
}

export function AIFeedbackList({ initialSummaries }: AIFeedbackListProps) {
  const [summaries, setSummaries] = useState(initialSummaries)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isBatchLoading, setIsBatchLoading] = useState(false)

  const toggleExpanded = (designerId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(designerId)) {
        next.delete(designerId)
      } else {
        next.add(designerId)
      }
      return next
    })
  }

  const generateForDesigner = async (designerId: string) => {
    setLoadingIds((prev) => new Set(prev).add(designerId))
    try {
      const response = await fetch('/api/ai/admin-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designerUserId: designerId }),
      })
      const result = await response.json()
      if (!response.ok || result.error) {
        toast.error(result.error || 'Failed to generate summary')
      } else {
        setSummaries((prev) =>
          prev.map((s) =>
            s.designerId === designerId
              ? {
                  ...s,
                  summary: {
                    id: result.id,
                    content: result.content,
                    createdAt: result.createdAt,
                  },
                }
              : s
          )
        )
        setExpandedIds((prev) => new Set(prev).add(designerId))
      }
    } catch {
      toast.error('Failed to generate summary')
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev)
        next.delete(designerId)
        return next
      })
    }
  }

  const generateAll = async () => {
    setIsBatchLoading(true)
    for (const s of summaries) {
      await generateForDesigner(s.designerId)
    }
    setIsBatchLoading(false)
    toast.success('All summaries generated!')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Weekly Reviews
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={generateAll}
          disabled={isBatchLoading}
        >
          {isBatchLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {summaries.map((item) => {
            const isLoading = loadingIds.has(item.designerId)
            const isExpanded = expandedIds.has(item.designerId)

            return (
              <div key={item.designerId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">{item.designerName}</span>
                    {item.summary && (
                      <span className="text-xs text-gray-400">
                        Updated {format(new Date(item.summary.createdAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.summary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(item.designerId)}
                        className="h-7 w-7 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateForDesigner(item.designerId)}
                      disabled={isLoading || isBatchLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : item.summary ? (
                        <RefreshCw className="h-3.5 w-3.5" />
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  </div>
                </div>
                {isExpanded && item.summary && (
                  <div className="mt-3 ml-6 prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {item.summary.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
