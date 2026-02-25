import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function FeedbackSkeleton() {
  return (
    <div className="space-y-6">
      {/* Time range toggle skeleton */}
      <div className="h-10 w-80 bg-gray-100 rounded-lg animate-pulse" />

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
