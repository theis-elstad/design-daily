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
      .eq('role', 'designer'),
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
      assets (id, storage_path, file_name),
      ratings (
        productivity,
        quality,
        convertability,
        profiles!inner (full_name)
      )
    `
    )
    .order('submission_date', { ascending: false })
    .limit(100)

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
    assets: { id: string; storage_path: string; file_name: string }[]
    ratings: { productivity: number; quality: number; convertability: number; profiles: { full_name: string | null } }[]
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
    const avgConvertability =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.convertability, 0) / ratings.length
        : null
    const avgTotal =
      avgProductivity !== null && avgQuality !== null && avgConvertability !== null
        ? avgProductivity + avgQuality + avgConvertability
        : null

    return {
      ...sub,
      avgProductivity,
      avgQuality,
      avgConvertability,
      avgTotal,
      assetCount: sub.assets?.length || 0,
      ratingCount: ratings.length,
    }
  })
}

export async function getDesigners() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'designer')
    .order('full_name')

  return data || []
}

export async function getDesignerStats() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select(
      `
      id,
      full_name,
      submissions (
        id,
        assets (id),
        ratings (
          productivity,
          quality,
          convertability
        )
      )
    `
    )
    .eq('role', 'designer')

  // Define types for the query result
  type DesignerWithSubmissions = {
    id: string
    full_name: string | null
    submissions: {
      id: string
      assets: { id: string }[]
      ratings: { productivity: number; quality: number; convertability: number }[]
    }[]
  }

  const typedData = (data || []) as DesignerWithSubmissions[]

  return typedData.map((designer) => {
    const submissions = designer.submissions || []
    const allRatings = submissions.flatMap((s) => s.ratings || [])
    const totalAssets = submissions.reduce(
      (sum, s) => sum + (s.assets?.length || 0),
      0
    )

    const avgProductivity =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.productivity, 0) / allRatings.length
        : null
    const avgQuality =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.quality, 0) / allRatings.length
        : null
    const avgConvertability =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.convertability, 0) / allRatings.length
        : null

    return {
      id: designer.id,
      name: designer.full_name,
      totalSubmissions: submissions.length,
      totalAssets,
      avgProductivity,
      avgQuality,
      avgConvertability,
      avgTotal:
        avgProductivity !== null && avgQuality !== null && avgConvertability !== null
          ? avgProductivity + avgQuality + avgConvertability
          : null,
    }
  })
}
