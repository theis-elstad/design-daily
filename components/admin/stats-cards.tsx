import { Users, Image, Star, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardsProps {
  stats: {
    totalSubmissions: number
    totalDesigners: number
    totalRatings: number
    avgRatingsPerSubmission: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Submissions',
      value: stats.totalSubmissions,
      icon: Image,
      description: 'All time',
    },
    {
      title: 'Active Designers',
      value: stats.totalDesigners,
      icon: Users,
      description: 'Registered designers',
    },
    {
      title: 'Total Ratings',
      value: stats.totalRatings,
      icon: Star,
      description: 'Submissions rated',
    },
    {
      title: 'Avg Ratings/Submission',
      value: stats.avgRatingsPerSubmission.toFixed(1),
      icon: BarChart3,
      description: 'Rating coverage',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
