export const runtime = 'edge'

import { Suspense } from 'react'
import { getVisibleApps } from '@/lib/actions/apps'
import { AppGrid } from '@/components/apps/app-grid'
import { AppGridSkeleton } from '@/components/apps/app-grid-skeleton'

async function AppGridContent() {
  const apps = await getVisibleApps()
  return <AppGrid apps={apps} />
}

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">App Hub</h1>
        <p className="text-gray-600 mt-1">
          Your central launchpad for all design tools
        </p>
      </div>

      <Suspense fallback={<AppGridSkeleton />}>
        <AppGridContent />
      </Suspense>
    </div>
  )
}
