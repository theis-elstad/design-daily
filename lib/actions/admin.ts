'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAdminStats() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const [
    { count: totalSubmissions },
    { count: totalDesigners },
    { count: totalRatings },
    { data: recentSubmissions },
  ] = await Promise.all([
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['designer', 'admin']),
    supabase.from('ratings').select('*', { count: 'exact', head: true }),
    supabase
      .from('submissions')
      .select('submission_date')
      .gte('submission_date', thirtyDaysAgoStr)
      .order('submission_date'),
  ])

  // Group submissions by date for chart
  type SubmissionDateRow = { submission_date: string }
  const submissions = (recentSubmissions || []) as SubmissionDateRow[]
  const submissionsByDate = submissions.reduce(
    (acc, sub) => {
      const date = sub.submission_date
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const chartData = Object.entries(submissionsByDate).map(([date, count]) => ({
    date,
    count,
  }))

  return {
    totalSubmissions: totalSubmissions || 0,
    totalDesigners: totalDesigners || 0,
    totalRatings: totalRatings || 0,
    avgRatingsPerSubmission:
      totalSubmissions && totalRatings
        ? Math.round((totalRatings / totalSubmissions) * 10) / 10
        : 0,
    chartData,
  }
}

export async function getAllSubmissions(filters: {
  startDate?: string
  endDate?: string
  userId?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('submissions')
    .select(
      `
      *,
      profiles!inner (full_name, email),
      assets (id, storage_path, file_name, asset_type),
      ratings (
        productivity,
        quality,
        profiles!inner (full_name)
      )
    `
    )
    .order('submission_date', { ascending: false })
    .limit(500)

  if (filters.startDate) {
    query = query.gte('submission_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('submission_date', filters.endDate)
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data } = await query

  // Define types for the query result
  type SubmissionWithRelations = {
    id: string
    user_id: string
    submission_date: string
    created_at: string
    profiles: { full_name: string | null; email: string }
    assets: { id: string; storage_path: string; file_name: string; asset_type: 'image' | 'video' }[]
    ratings: { productivity: number; quality: number; profiles: { full_name: string | null } }[]
  }

  const typedData = (data || []) as SubmissionWithRelations[]

  return typedData.map((sub) => {
    const ratings = sub.ratings || []
    const avgProductivity =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.productivity, 0) / ratings.length
        : null
    const avgQuality =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.quality, 0) / ratings.length
        : null
    const avgTotal =
      avgProductivity !== null && avgQuality !== null
        ? avgProductivity + avgQuality
        : null

    const assets = sub.assets || []
    const imageCount = assets.filter((a) => a.asset_type === 'image').length
    const videoCount = assets.filter((a) => a.asset_type === 'video').length

    return {
      ...sub,
      avgProductivity,
      avgQuality,
      avgTotal,
      assetCount: assets.length,
      imageCount,
      videoCount,
      ratingCount: ratings.length,
    }
  })
}

export async function getDesigners() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['designer', 'admin'])
    .order('full_name')

  return data || []
}

export type DesignerStatsTimeRange = 'today' | 'yesterday' | '7days' | '30days' | 'all'

export async function getDesignerStats(timeRange: DesignerStatsTimeRange = 'all') {
  const supabase = await createClient()

  // Build the date filter
  let startDate: string | null = null
  if (timeRange !== 'all') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    switch (timeRange) {
      case 'today':
        startDate = today.toISOString().split('T')[0]
        break
      case 'yesterday': {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.toISOString().split('T')[0]
        break
      }
      case '7days': {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        break
      }
      case '30days': {
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)
        startDate = monthAgo.toISOString().split('T')[0]
        break
      }
    }
  }

  let query = supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      submissions (
        id,
        submission_date,
        assets (id, asset_type),
        ratings (
          productivity,
          quality
        )
      )
    `
    )
    .in('role', ['designer', 'admin'])

  const { data } = await query

  // Define types for the query result
  type DesignerWithSubmissions = {
    id: string
    full_name: string | null
    submissions: {
      id: string
      submission_date: string
      assets: { id: string; asset_type: 'image' | 'video' }[]
      ratings: { productivity: number; quality: number }[]
    }[]
  }

  const typedData = (data || []) as DesignerWithSubmissions[]

  return typedData.map((designer) => {
    // Filter submissions by date range if applicable
    let submissions = designer.submissions || []
    if (startDate) {
      submissions = submissions.filter((s) => s.submission_date >= startDate!)
    }

    const allRatings = submissions.flatMap((s) => s.ratings || [])
    const allAssets = submissions.flatMap((s) => s.assets || [])
    const staticAssets = allAssets.filter((a) => a.asset_type === 'image').length
    const videoAssets = allAssets.filter((a) => a.asset_type === 'video').length

    const avgProductivity =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.productivity, 0) / allRatings.length
        : null
    const avgQuality =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.quality, 0) / allRatings.length
        : null
    return {
      id: designer.id,
      name: designer.full_name,
      totalSubmissions: submissions.length,
      staticAssets,
      videoAssets,
      avgProductivity,
      avgQuality,
      avgTotal:
        avgProductivity !== null && avgQuality !== null
          ? avgProductivity + avgQuality
          : null,
    }
  })
}

export type TimeRange = 'today' | 'yesterday' | 'week' | 'month'

function getDateRangeForTimeRange(timeRange: TimeRange): { startDate: string; endDate: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = today.toISOString().split('T')[0]

  let startDate: string

  switch (timeRange) {
    case 'today':
      startDate = endDate
      break
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = yesterday.toISOString().split('T')[0]
      break
    }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = weekAgo.toISOString().split('T')[0]
      break
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      startDate = monthAgo.toISOString().split('T')[0]
      break
    }
    default:
      startDate = endDate
  }

  return { startDate, endDate }
}

export async function getDesignerProductivityData(timeRange: TimeRange) {
  const supabase = await createClient()
  const { startDate, endDate } = getDateRangeForTimeRange(timeRange)

  // Get all submissions with designer info in the date range
  const { data } = await supabase
    .from('submissions')
    .select(
      `
      submission_date,
      user_id,
      profiles!inner (full_name),
      assets (id)
    `
    )
    .gte('submission_date', startDate)
    .lte('submission_date', endDate)
    .order('submission_date')

  type SubmissionRow = {
    submission_date: string
    user_id: string
    profiles: { full_name: string | null }
    assets: { id: string }[]
  }

  const submissions = (data || []) as SubmissionRow[]

  // Get unique designers
  const designerMap = new Map<string, string>()
  submissions.forEach((sub) => {
    const name = sub.profiles.full_name || 'Unknown'
    designerMap.set(sub.user_id, name)
  })
  const designers = Array.from(designerMap.entries()).map(([id, name]) => ({ id, name }))

  // Group by date and designer
  const dataByDate = new Map<string, Record<string, number>>()

  submissions.forEach((sub) => {
    const date = sub.submission_date
    const designerName = sub.profiles.full_name || 'Unknown'
    const assetCount = sub.assets?.length || 0

    if (!dataByDate.has(date)) {
      dataByDate.set(date, {})
    }
    const dateData = dataByDate.get(date)!
    dateData[designerName] = (dateData[designerName] || 0) + assetCount
  })

  // Convert to array format for recharts
  const chartData = Array.from(dataByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, designerData]) => ({
      date,
      ...designerData,
    }))

  return {
    chartData,
    designers,
    timeRange,
    startDate,
    endDate,
  }
}
