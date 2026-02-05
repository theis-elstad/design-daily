import { Suspense } from 'react'
import {
  getAdminStats,
  getAllSubmissions,
  getDesigners,
  getDesignerStats,
} from '@/lib/actions/admin'
import { StatsCards } from '@/components/admin/stats-cards'
import { SubmissionsChart } from '@/components/admin/submissions-chart'
import { SubmissionsTable } from '@/components/admin/submissions-table'
import { DesignerStatsTable } from '@/components/admin/designer-stats-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function AdminDashboardContent() {
  const [stats, submissions, designers, designerStats] = await Promise.all([
    getAdminStats(),
    getAllSubmissions({}),
    getDesigners(),
    getDesignerStats(),
  ])

  return (
    <div className="space-y-8">
      <StatsCards stats={stats} />

      <SubmissionsChart data={stats.chartData} />

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">All Submissions</TabsTrigger>
          <TabsTrigger value="designers">Designer Summary</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTable submissions={submissions} designers={designers} />
        </TabsContent>
        <TabsContent value="designers" className="mt-4">
          <DesignerStatsTable stats={designerStats} />
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
      <Skeleton className="h-[350px] rounded-lg" />
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
