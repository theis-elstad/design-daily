import { AppCard } from '@/components/apps/app-card'
import type { App } from '@/lib/types/database'
import { LayoutGrid } from 'lucide-react'

interface AppGridProps {
  apps: App[]
}

export function AppGrid({ apps }: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No apps available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Apps will appear here once they are added.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
