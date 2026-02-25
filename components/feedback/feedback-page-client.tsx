'use client'

import { useState } from 'react'
import { FeedbackKpiBanner } from './feedback-kpi-banner'
import { FeedbackTable } from './feedback-table'
import { FeedbackAISummary } from './feedback-ai-summary'
import type { FeedbackRow, FeedbackKPIs } from '@/lib/actions/feedback'

interface FeedbackPageClientProps {
  initialRows: FeedbackRow[]
  initialKpis: FeedbackKPIs
  aiSummary: {
    id: string
    content: string
    createdAt: string
  } | null
}

export function FeedbackPageClient({
  initialRows,
  initialKpis,
  aiSummary,
}: FeedbackPageClientProps) {
  const [rows, setRows] = useState(initialRows)

  const handleDataChange = (newRows: FeedbackRow[], _newKpis: FeedbackKPIs) => {
    setRows(newRows)
  }

  return (
    <div className="space-y-6">
      <FeedbackKpiBanner
        initialKpis={initialKpis}
        initialTimeRange="all"
        onDataChange={handleDataChange}
      />

      <FeedbackAISummary summary={aiSummary} />

      <FeedbackTable rows={rows} />
    </div>
  )
}
