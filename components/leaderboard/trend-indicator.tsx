import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'same'
}

export function TrendIndicator({ trend }: TrendIndicatorProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        trend === 'up' && 'text-green-600',
        trend === 'down' && 'text-red-600',
        trend === 'same' && 'text-gray-400'
      )}
    >
      {trend === 'up' && <TrendingUp className="h-4 w-4" />}
      {trend === 'down' && <TrendingDown className="h-4 w-4" />}
      {trend === 'same' && <Minus className="h-4 w-4" />}
    </span>
  )
}
