import { Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DesignerOverviewProps {
  designers: {
    id: string
    name: string
    hasSubmitted: boolean
  }[]
}

export function DesignerOverview({ designers }: DesignerOverviewProps) {
  const submitted = designers.filter((d) => d.hasSubmitted).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Designer Overview ({submitted}/{designers.length} submitted)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {designers.map((designer) => (
            <div
              key={designer.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                designer.hasSubmitted
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              {designer.hasSubmitted ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">{designer.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
