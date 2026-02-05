import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DesignerStat {
  id: string
  name: string | null
  totalSubmissions: number
  totalAssets: number
  avgProductivity: number | null
  avgQuality: number | null
  avgConvertability: number | null
  avgTotal: number | null
}

interface DesignerStatsTableProps {
  stats: DesignerStat[]
}

export function DesignerStatsTable({ stats }: DesignerStatsTableProps) {
  const formatScore = (score: number | null) => {
    if (score === null) return '-'
    return score.toFixed(2)
  }

  const sortedStats = [...stats].sort((a, b) => {
    if (a.avgTotal === null && b.avgTotal === null) return 0
    if (a.avgTotal === null) return 1
    if (b.avgTotal === null) return -1
    return b.avgTotal - a.avgTotal
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Designer Performance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Designer</TableHead>
                <TableHead className="text-center">Submissions</TableHead>
                <TableHead className="text-center">Assets</TableHead>
                <TableHead className="text-center">Avg Productivity</TableHead>
                <TableHead className="text-center">Avg Quality</TableHead>
                <TableHead className="text-center">Avg Convertability</TableHead>
                <TableHead className="text-center">Avg Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No designer data available
                  </TableCell>
                </TableRow>
              ) : (
                sortedStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">
                      {stat.name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-center">{stat.totalSubmissions}</TableCell>
                    <TableCell className="text-center">{stat.totalAssets}</TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgProductivity === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgProductivity)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgQuality === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgQuality)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-center',
                        stat.avgConvertability === null && 'text-gray-400'
                      )}
                    >
                      {formatScore(stat.avgConvertability)}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatScore(stat.avgTotal)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
