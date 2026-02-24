export const runtime = 'edge'

import { Suspense } from 'react'
import {
  getAdminStats,
  getAllSubmissions,
  getDesigners,
  getDesignerStats,
} from '@/lib/actions/admin'
import { getAllApps } from '@/lib/actions/apps'
import { StatsCards } from '@/components/admin/stats-cards'
import { SubmissionsTable } from '@/components/admin/submissions-table'
import { DesignerStatsTable } from '@/components/admin/designer-stats-table'
import { AdminAppList } from '@/components/apps/admin-app-list'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function AdminDashboardContent() {
  const [stats, submissions, designers, designerStats, apps] = await Promise.all([
    getAdminStats(),
    getAllSubmissions({}),
    getDesigners(),
    getDesignerStats(),
    getAllApps(),
  ])

  return (
    <div className="space-y-8">
      <StatsCards stats={stats} />

      <Tabs defaultValue="designers">
        <TabsList>
          <TabsTrigger value="designers">Designer Summary</TabsTrigger>
          <TabsTrigger value="submissions">All Submissions</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
        </TabsList>
        <TabsContent value="designers" className="mt-4">
          <DesignerStatsTable stats={designerStats} />
        </TabsContent>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} designers={designers} />
        </TabsContent>
        <TabsContent value="apps" className="mt-4">
          <AdminAppList apps={apps} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of all submissions, ratings, and designer performance
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardContent />
      </Suspense>
    </div>
  )
}
