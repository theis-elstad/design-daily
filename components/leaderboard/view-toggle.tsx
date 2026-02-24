'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Grid3X3 } from 'lucide-react'

interface ViewToggleProps {
  currentView: 'table' | 'matrix'
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams()
    if (value === 'matrix') {
      params.set('view', 'matrix')
    }
    // When switching views, reset to default range for that view
    // Don't carry over range/week_offset between views
    router.push(`/leaderboard${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <Tabs value={currentView} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="table" className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5" />
          Leaderboard
        </TabsTrigger>
        <TabsTrigger value="matrix" className="flex items-center gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5" />
          Matrix
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
