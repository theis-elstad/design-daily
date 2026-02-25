'use server'

import { createClient } from '@/lib/supabase/server'
import { computeWeightedProductivityCount } from '@/lib/utils'

export type FeedbackRow = {
  submissionDate: string
  staticCount: number
  videoCount: number
  productivity: number | null
  quality: number | null
  totalScore: number | null
  judgeComment: string | null
  judgedBy: string | null
  designerComment: string | null
}

export type FeedbackKPIs = {
  totalSubmissions: number
  statics: number
  videos: number
  weightedCount: number
  avgProductivity: number
  avgQuality: number
  avgTotal: number
}

function getDateRange(timeRange: string): { start: string; end: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = today.toISOString().split('T')[0]

  switch (timeRange) {
    case 'last_biz_day': {
      const dow = today.getDay()
      let offset = 1
      if (dow === 0) offset = 2 // Sunday → Friday
      if (dow === 1) offset = 3 // Monday → Friday
      if (dow === 6) offset = 1 // Saturday → Friday
      const start = new Date(today)
      start.setDate(start.getDate() - offset)
      return { start: start.toISOString().split('T')[0], end: start.toISOString().split('T')[0] }
    }
    case 'weekly': {
      const start = new Date(today)
      start.setDate(start.getDate() - 7)
      return { start: start.toISOString().split('T')[0], end }
    }
    case 'last_30': {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return { start: start.toISOString().split('T')[0], end }
    }
    default:
      return { start: '1970-01-01', end }
  }
}

export async function getMyFeedback(timeRange: string = 'all'): Promise<{
  rows: FeedbackRow[]
  kpis: FeedbackKPIs
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { rows: [], kpis: { totalSubmissions: 0, statics: 0, videos: 0, weightedCount: 0, avgProductivity: 0, avgQuality: 0, avgTotal: 0 } }

  const { start, end } = getDateRange(timeRange)

  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submission_date,
      comment,
      assets (
        id,
        asset_type,
        duration
      ),
      ratings (
        productivity,
        quality,
        comment,
        profiles (
          full_name
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('submission_date', start)
    .lte('submission_date', end)
    .order('submission_date', { ascending: false })

  type SubmissionFeedback = {
    id: string
    submission_date: string
    comment: string | null
    assets: { id: string; asset_type: 'image' | 'video'; duration: number | null }[]
    ratings: { productivity: number; quality: number; comment: string | null; profiles: { full_name: string | null } }[]
  }

  const typedSubmissions = (submissions || []) as SubmissionFeedback[]

  let totalStatics = 0
  let totalVideos = 0
  let totalWeighted = 0
  let productivitySum = 0
  let qualitySum = 0
  let ratedCount = 0

  const rows: FeedbackRow[] = typedSubmissions.map((sub) => {
    const statics = sub.assets?.filter((a) => a.asset_type === 'image').length || 0
    const videos = sub.assets?.filter((a) => a.asset_type === 'video') || []
    const videoCount = videos.length
    const weighted = computeWeightedProductivityCount(statics, videos)

    totalStatics += statics
    totalVideos += videoCount
    totalWeighted += weighted

    // Use first rating (typically only one judge)
    const rating = sub.ratings?.[0] || null
    const productivity = rating?.productivity ?? null
    const quality = rating?.quality ?? null
    const total = productivity !== null && quality !== null ? productivity + quality : null

    if (productivity !== null && quality !== null) {
      productivitySum += productivity
      qualitySum += quality
      ratedCount++
    }

    return {
      submissionDate: sub.submission_date,
      staticCount: statics,
      videoCount,
      productivity,
      quality,
      totalScore: total,
      judgeComment: rating?.comment ?? null,
      judgedBy: rating?.profiles?.full_name ?? null,
      designerComment: sub.comment,
    }
  })

  const kpis: FeedbackKPIs = {
    totalSubmissions: typedSubmissions.length,
    statics: totalStatics,
    videos: totalVideos,
    weightedCount: Math.round(totalWeighted * 10) / 10,
    avgProductivity: ratedCount > 0 ? Math.round((productivitySum / ratedCount) * 100) / 100 : 0,
    avgQuality: ratedCount > 0 ? Math.round((qualitySum / ratedCount) * 100) / 100 : 0,
    avgTotal: ratedCount > 0 ? Math.round(((productivitySum + qualitySum) / ratedCount) * 100) / 100 : 0,
  }

  return { rows, kpis }
}

export async function getMyLatestAISummary(): Promise<{
  id: string
  content: string
  createdAt: string
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('ai_summaries')
    .select('id, content, created_at')
    .eq('target_user_id', user.id)
    .eq('type', 'designer_feedback')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  type AISummaryRow = { id: string; content: string; created_at: string }
  const typed = data as AISummaryRow | null

  if (!typed) return null

  return {
    id: typed.id,
    content: typed.content,
    createdAt: typed.created_at,
  }
}

export async function getAdminAISummaries(): Promise<{
  designerId: string
  designerName: string
  summary: { id: string; content: string; createdAt: string } | null
}[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { role: string } | null
  if (typedProfile?.role !== 'admin') return []

  // Get all designers
  const { data: designers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['designer', 'admin'])
    .order('full_name')

  type Designer = { id: string; full_name: string | null }
  const typedDesigners = (designers || []) as Designer[]

  // Get latest admin_weekly summary per designer
  const { data: summaries } = await supabase
    .from('ai_summaries')
    .select('id, target_user_id, content, created_at')
    .eq('type', 'admin_weekly')
    .order('created_at', { ascending: false })

  type SummaryRow = { id: string; target_user_id: string; content: string; created_at: string }
  const typedSummaries = (summaries || []) as SummaryRow[]

  // Map to latest per designer
  const latestByDesigner = new Map<string, SummaryRow>()
  for (const s of typedSummaries) {
    if (!latestByDesigner.has(s.target_user_id)) {
      latestByDesigner.set(s.target_user_id, s)
    }
  }

  return typedDesigners.map((d) => {
    const s = latestByDesigner.get(d.id)
    return {
      designerId: d.id,
      designerName: d.full_name || 'Unknown',
      summary: s ? { id: s.id, content: s.content, createdAt: s.created_at } : null,
    }
  })
}
