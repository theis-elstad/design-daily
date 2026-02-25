'use client'

import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIMarkdown } from '@/components/ui/ai-markdown'

interface FeedbackAISummaryProps {
  summary: {
    id: string
    content: string
    createdAt: string
  } | null
}

export function FeedbackAISummary({ summary: initialSummary }: FeedbackAISummaryProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/designer-feedback', {
        method: 'POST',
      })
      const result = await response.json()
      if (!response.ok || result.error) {
        toast.error(result.error || 'Failed to generate summary')
      } else {
        setSummary({
          id: result.id,
          content: result.content,
          createdAt: result.createdAt,
        })
        toast.success('AI summary generated!')
      }
    } catch {
      toast.error('Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Feedback Summary
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Generating...
            </>
          ) : summary ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="space-y-3">
            <AIMarkdown content={summary.content} />
            <p className="text-xs text-gray-400">
              Generated {format(new Date(summary.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No AI summary yet. Click &quot;Generate&quot; to get personalized feedback insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
