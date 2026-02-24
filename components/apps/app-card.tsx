'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, getLetterAvatarColor } from '@/lib/utils'
import type { App } from '@/lib/types/database'

interface AppCardProps {
  app: App
}

function LetterAvatar({ name }: { name: string }) {
  const colorClass = getLetterAvatarColor(name)
  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white',
        colorClass
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') return null
  const variant = status === 'beta' ? 'outline' : 'secondary'
  return (
    <Badge variant={variant} className="text-xs capitalize">
      {status}
    </Badge>
  )
}

export function AppCard({ app }: AppCardProps) {
  const isMaintenance = app.status === 'maintenance'

  const cardContent = (
    <Card
      className={cn(
        'group relative flex items-start gap-4 p-5 transition-all duration-200',
        isMaintenance
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-blue-300'
      )}
    >
      {app.icon_url ? (
        <img
          src={app.icon_url}
          alt={app.name}
          className="h-12 w-12 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <LetterAvatar name={app.name} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {app.name}
          </h3>
          <StatusBadge status={app.status} />
        </div>
        {app.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">
            {app.description}
          </p>
        )}
      </div>
      {app.open_in_new_tab && !isMaintenance && (
        <ExternalLink className="h-4 w-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      {isMaintenance && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
          <span className="text-sm font-medium text-gray-500">Unavailable</span>
        </div>
      )}
    </Card>
  )

  if (isMaintenance) {
    return cardContent
  }

  if (app.open_in_new_tab) {
    return (
      <a href={app.url} target="_blank" rel="noopener noreferrer">
        {cardContent}
      </a>
    )
  }

  return <Link href={app.url}>{cardContent}</Link>
}
