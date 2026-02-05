'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type ViewMode = 'podium' | 'list'

interface ViewToggleProps {
  currentView: ViewMode
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <Tabs value={currentView} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="podium" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Podium
        </TabsTrigger>
        <TabsTrigger value="list" className="gap-2">
          <List className="h-4 w-4" />
          Full List
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
