'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AIContextPanelProps {
  designerUserId: string
}

export function AIContextPanel({ designerUserId }: AIContextPanelProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/judge-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designerUserId }),
      })
      const result = await response.json()
      if (!response.ok || result.error) {
        toast.error(result.error || 'Failed to generate context')
      } else {
        setContent(result.content)
        setIsExpanded(true)
      }
    } catch {
      toast.error('Failed to generate AI context')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Context
        </CardTitle>
        <div className="flex items-center gap-2">
          {content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
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
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Loading...
              </>
            ) : content ? (
              'Refresh'
            ) : (
              'Get Context'
            )}
          </Button>
        </div>
      </CardHeader>
      {content && isExpanded && (
        <CardContent>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {content}
          </div>
        </CardContent>
      )}
      {!content && !isLoading && (
        <CardContent className="pt-0">
          <p className="text-xs text-gray-400">
            Get AI-powered context about this designer&apos;s recent patterns and feedback history.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
