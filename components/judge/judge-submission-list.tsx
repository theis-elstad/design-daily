'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, subBusinessDays } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SubmissionCard } from './submission-card'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Submission {
  id: string
  submission_date: string
  submitterName: string
  comment?: string | null
  imageCount: number
  videoCount: number
  status: 'needs_review' | 'rated' | 'edited'
}

interface JudgeSubmissionListProps {
  submissions: Submission[]
  initialTab: string
  isDateFiltered?: boolean
}

// --- Grouping logic ---

interface GroupedSubmissions {
  reviewToday: Submission[]
  justIn: Submission[]
  earlier: Submission[]
}

function groupSubmissions(submissions: Submission[]): GroupedSubmissions {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = format(today, 'yyyy-MM-dd')
  const lastBizDayStr = format(subBusinessDays(today, 1), 'yyyy-MM-dd')

  const reviewToday: Submission[] = []
  const justIn: Submission[] = []
  const earlier: Submission[] = []

  for (const sub of submissions) {
    if (sub.submission_date === lastBizDayStr) {
      reviewToday.push(sub)
    } else if (sub.submission_date === todayStr) {
      justIn.push(sub)
    } else {
      earlier.push(sub)
    }
  }

  return { reviewToday, justIn, earlier }
}

// --- Sub-components ---

function SubmissionSection({
  icon: Icon,
  iconColor,
  label,
  count,
  meta,
  children,
  accentBorder,
  accentBg,
  defaultCollapsed,
  headerSize = 'base',
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  count: number
  meta?: string
  children: React.ReactNode
  accentBorder?: string
  accentBg?: string
  defaultCollapsed?: boolean
  headerSize?: 'base' | 'sm'
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? false)
  const isCollapsible = defaultCollapsed !== undefined

  return (
    <div className={cn(accentBg, 'rounded-lg', accentBorder && 'border-l-4 pl-4', accentBorder)}>
      <button
        onClick={() => isCollapsible && setCollapsed(!collapsed)}
        className={cn(
          'flex items-center gap-2 w-full text-left py-3',
          isCollapsible ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        )}
        type="button"
      >
        <Icon className={cn('h-4 w-4 shrink-0', iconColor)} />
        <span
          className={cn(
            headerSize === 'base'
              ? 'text-base font-semibold text-gray-900'
              : 'text-sm font-medium text-gray-500'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            headerSize === 'base' ? 'text-amber-600 font-medium' : 'text-gray-400'
          )}
        >
          ({count})
        </span>
        {meta && (
          <span className="text-xs text-gray-400 ml-1 hidden sm:inline">{meta}</span>
        )}
        {isCollapsible && (
          <span className="ml-auto">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </span>
        )}
      </button>
      {!collapsed && <div className="space-y-3 pb-3">{children}</div>}
    </div>
  )
}

function DateDivider({ date, count }: { date: string; count: number }) {
  const d = new Date(date + 'T00:00:00')
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {format(d, 'EEE, MMM d')} ({count})
      </span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

function getDateRangeMeta(submissions: Submission[]): string {
  if (submissions.length === 0) return ''
  const dates = [...new Set(submissions.map((s) => s.submission_date))].sort()
  const first = new Date(dates[0] + 'T00:00:00')
  const last = new Date(dates[dates.length - 1] + 'T00:00:00')
  if (dates[0] === dates[dates.length - 1]) {
    return format(first, 'MMM d')
  }
  return `${format(first, 'MMM d')} \u2013 ${format(last, 'MMM d')}`
}

function EarlierCards({ submissions }: { submissions: Submission[] }) {
  // Group by date, preserving existing DESC order
  const byDate = new Map<string, Submission[]>()
  for (const sub of submissions) {
    const existing = byDate.get(sub.submission_date) || []
    existing.push(sub)
    byDate.set(sub.submission_date, existing)
  }

  const dateGroups = Array.from(byDate.entries())

  return (
    <>
      {dateGroups.map(([date, subs], groupIndex) => (
        <div key={date}>
          {dateGroups.length > 1 && <DateDivider date={date} count={subs.length} />}
          <div className="space-y-3">
            {subs.map((sub) => (
              <SubmissionCard key={sub.id} submission={sub} />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

// --- Main component ---

export function JudgeSubmissionList({
  submissions,
  initialTab,
  isDateFiltered,
}: JudgeSubmissionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const needsReview = submissions.filter(
    (s) => s.status === 'needs_review' || s.status === 'edited'
  )
  const completed = submissions.filter((s) => s.status === 'rated')

  const grouped = !isDateFiltered ? groupSubmissions(needsReview) : null

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'review') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const queryString = params.toString()
    router.push(`/judge${queryString ? `?${queryString}` : ''}`)
  }

  return (
    <Tabs defaultValue={initialTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="review" className="gap-2">
          <Clock className="h-4 w-4" />
          Needs Review ({needsReview.length})
        </TabsTrigger>
        <TabsTrigger value="completed" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Completed ({completed.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="review">
        {needsReview.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h3>
            <p className="text-gray-500">No submissions need your review right now.</p>
          </div>
        ) : isDateFiltered || !grouped ? (
          // Date-filtered: flat list (grouping makes no sense for a single date)
          <div className="space-y-3">
            {needsReview.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        ) : (
          // Unfiltered: grouped by priority
          <div className="space-y-6">
            {/* Review Today — last business day's submissions */}
            {grouped.reviewToday.length > 0 ? (
              <SubmissionSection
                icon={AlertCircle}
                iconColor="text-amber-500"
                label="Review Today"
                count={grouped.reviewToday.length}
                accentBorder="border-amber-400"
                accentBg="bg-amber-50/50"
                headerSize="base"
              >
                {grouped.reviewToday.map((sub) => (
                  <SubmissionCard key={sub.id} submission={sub} />
                ))}
              </SubmissionSection>
            ) : (
              <div className="flex items-center gap-2 py-3 px-4 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 shrink-0" />
                All caught up for today
              </div>
            )}

            {/* Just In — today's submissions */}
            {grouped.justIn.length > 0 && (
              <SubmissionSection
                icon={Clock}
                iconColor="text-gray-400"
                label="Just In"
                count={grouped.justIn.length}
                headerSize="sm"
              >
                {grouped.justIn.map((sub) => (
                  <SubmissionCard key={sub.id} submission={sub} />
                ))}
              </SubmissionSection>
            )}

            {/* Earlier — backlog, collapsible */}
            {grouped.earlier.length > 0 && (
              <SubmissionSection
                icon={Archive}
                iconColor="text-gray-400"
                label="Earlier"
                count={grouped.earlier.length}
                meta={getDateRangeMeta(grouped.earlier)}
                headerSize="sm"
                defaultCollapsed={grouped.earlier.length > 5}
              >
                <EarlierCards submissions={grouped.earlier} />
              </SubmissionSection>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed">
        {completed.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No completed reviews</h3>
            <p className="text-gray-500">Submissions you review will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
