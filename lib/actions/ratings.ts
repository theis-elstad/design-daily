'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function computeSuggestedProductivity(assetCount: number, medianAssetCount: number): number {
  if (medianAssetCount === 0) return 3
  const ratio = assetCount / medianAssetCount
  if (ratio <= 0.6) return 1
  if (ratio <= 0.8) return 2
  if (ratio <= 1.0) return 3
  if (ratio <= 1.2) return 4
  return 5
}

export async function getSubmissionsForJudging(date?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Build query with profile join and asset_type
  let query = supabase
    .from('submissions')
    .select(
      `
      id,
      submission_date,
      user_id,
      comment,
      updated_at,
      profiles (
        full_name
      ),
      assets (
        id,
        storage_path,
        file_name,
        asset_type
      ),
      ratings!left (
        id,
        rated_by,
        productivity,
        quality,
        created_at
      )
    `
    )
    .order('submission_date', { ascending: false })
    .limit(500)

  // Only filter by date if one is provided
  if (date) {
    query = query.eq('submission_date', date)
  }

  const { data: submissions } = await query

  // Define types for the query result
  type SubmissionForJudging = {
    id: string
    submission_date: string
    user_id: string
    comment: string | null
    updated_at: string | null
    profiles: { full_name: string | null }
    assets: { id: string; storage_path: string; file_name: string; asset_type: 'image' | 'video' }[]
    ratings: { id: string; rated_by: string; productivity: number; quality: number; created_at: string }[]
  }

  const typedSubmissions = (submissions || []) as SubmissionForJudging[]

  // Determine status: needs_review, rated, or edited
  // A submission is "rated" once ANY admin has rated it (not just the current user)
  return typedSubmissions.map((sub) => {
    const myRating = sub.ratings?.find((r) => r.rated_by === user.id)
    const hasAnyRating = sub.ratings && sub.ratings.length > 0

    let status: 'needs_review' | 'rated' | 'edited' = 'needs_review'
    if (hasAnyRating) {
      const latestRating = sub.ratings.reduce((latest, r) =>
        new Date(r.created_at) > new Date(latest.created_at) ? r : latest
      )
      if (sub.updated_at && new Date(sub.updated_at) > new Date(latestRating.created_at)) {
        status = 'edited'
      } else {
        status = 'rated'
      }
    }

    return {
      id: sub.id,
      submission_date: sub.submission_date,
      user_id: sub.user_id,
      comment: sub.comment,
      submitterName: sub.profiles?.full_name || 'Unknown',
      imageCount: sub.assets?.filter((a) => a.asset_type === 'image').length || 0,
      videoCount: sub.assets?.filter((a) => a.asset_type === 'video').length || 0,
      assets: sub.assets || [],
      status,
      myRating: myRating || null,
    }
  })
}

export async function getSubmissionForJudgingById(submissionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('submissions')
    .select(
      `
      id,
      submission_date,
      user_id,
      comment,
      updated_at,
      profiles (
        full_name
      ),
      assets (
        id,
        storage_path,
        file_name,
        asset_type
      ),
      ratings!left (
        id,
        rated_by,
        productivity,
        quality,
        created_at,
        profiles (
          full_name
        )
      )
    `
    )
    .eq('id', submissionId)
    .single()

  if (!data) return null

  type SubmissionResult = {
    id: string
    submission_date: string
    user_id: string
    comment: string | null
    updated_at: string | null
    profiles: { full_name: string | null }
    assets: { id: string; storage_path: string; file_name: string; asset_type: 'image' | 'video' }[]
    ratings: { id: string; rated_by: string; productivity: number; quality: number; created_at: string; profiles: { full_name: string | null } }[]
  }

  const sub = data as SubmissionResult
  const myRating = sub.ratings?.find((r) => r.rated_by === user.id)
  const hasAnyRating = sub.ratings && sub.ratings.length > 0

  let status: 'needs_review' | 'rated' | 'edited' = 'needs_review'
  if (hasAnyRating) {
    const latestRating = sub.ratings.reduce((latest, r) =>
      new Date(r.created_at) > new Date(latest.created_at) ? r : latest
    )
    if (sub.updated_at && new Date(sub.updated_at) > new Date(latestRating.created_at)) {
      status = 'edited'
    } else {
      status = 'rated'
    }
  }

  // Calculate suggested productivity based on median asset count for the day
  const { data: daySubmissions } = await supabase
    .from('submissions')
    .select('id, assets(id)')
    .eq('submission_date', sub.submission_date)

  type DaySubmission = { id: string; assets: { id: string }[] }
  const assetCounts = ((daySubmissions || []) as DaySubmission[])
    .map((s) => s.assets?.length || 0)
    .sort((a, b) => a - b)
  const mid = Math.floor(assetCounts.length / 2)
  const medianAssetCount =
    assetCounts.length === 0
      ? 0
      : assetCounts.length % 2 !== 0
        ? assetCounts[mid]
        : (assetCounts[mid - 1] + assetCounts[mid]) / 2

  const totalAssets = sub.assets?.length || 0
  const suggestedProductivity = computeSuggestedProductivity(totalAssets, medianAssetCount)

  return {
    id: sub.id,
    submission_date: sub.submission_date,
    user_id: sub.user_id,
    comment: sub.comment,
    submitterName: sub.profiles?.full_name || 'Unknown',
    imageCount: sub.assets?.filter((a) => a.asset_type === 'image').length || 0,
    videoCount: sub.assets?.filter((a) => a.asset_type === 'video').length || 0,
    assets: sub.assets || [],
    status,
    myRating: myRating || null,
    suggestedProductivity,
    allRatings: (sub.ratings || []).map((r) => ({
      ratedBy: r.profiles?.full_name || 'Unknown',
      productivity: r.productivity,
      quality: r.quality,
      ratedAt: r.created_at,
    })),
  }
}

export async function submitRating(
  submissionId: string,
  ratings: {
    productivity: number
    quality: number
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { role: string } | null
  if (typedProfile?.role !== 'admin') {
    return { error: 'Only admins can rate submissions' }
  }

  // Upsert the rating (update if exists, insert if not)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('ratings') as any).upsert(
    {
      submission_id: submissionId,
      rated_by: user.id,
      productivity: ratings.productivity,
      quality: ratings.quality,
    },
    {
      onConflict: 'submission_id,rated_by',
    }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/judge', 'layout')
  return { success: true }
}

export async function getJudgingStats(date?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Build total submissions query
  let totalQuery = supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })

  if (date) {
    totalQuery = totalQuery.eq('submission_date', date)
  }

  const { count: totalSubmissions } = await totalQuery

  // Build rated submissions query — include submission updated_at and rating created_at
  // Count submissions rated by ANY admin, not just the current user
  let ratedQuery = supabase
    .from('ratings')
    .select('submission_id, created_at, submissions!inner(submission_date, updated_at)')

  if (date) {
    ratedQuery = ratedQuery.eq('submissions.submission_date', date)
  }

  const { data: ratedSubmissions } = await ratedQuery

  type RatedSubmission = {
    submission_id: string
    created_at: string
    submissions: { submission_date: string; updated_at: string | null }
  }

  const typedRated = (ratedSubmissions || []) as unknown as RatedSubmission[]

  // Group ratings by submission_id to find the latest rating per submission
  const ratingsBySubmission = new Map<string, RatedSubmission[]>()
  for (const r of typedRated) {
    const existing = ratingsBySubmission.get(r.submission_id) || []
    existing.push(r)
    ratingsBySubmission.set(r.submission_id, existing)
  }

  // A submission is "fully rated" if it has at least one rating
  // and hasn't been edited after the latest rating
  let fullyRatedCount = 0
  for (const [, ratings] of ratingsBySubmission) {
    const latestRating = ratings.reduce((latest, r) =>
      new Date(r.created_at) > new Date(latest.created_at) ? r : latest
    )
    const updatedAt = latestRating.submissions?.updated_at
    if (!updatedAt || new Date(updatedAt) <= new Date(latestRating.created_at)) {
      fullyRatedCount++
    }
  }

  return {
    total: totalSubmissions || 0,
    rated: fullyRatedCount,
    remaining: (totalSubmissions || 0) - fullyRatedCount,
  }
}

export async function getDesignerSubmissionOverview(date: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const [{ data: designers }, { data: submissions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['designer', 'admin'])
      .order('full_name'),
    supabase
      .from('submissions')
      .select('user_id')
      .eq('submission_date', date),
  ])

  type Designer = { id: string; full_name: string | null }
  type Submission = { user_id: string }

  const submittedUserIds = new Set(
    ((submissions || []) as Submission[]).map((s) => s.user_id)
  )

  return ((designers || []) as Designer[]).map((d) => ({
    id: d.id,
    name: d.full_name || 'Unknown',
    hasSubmitted: submittedUserIds.has(d.id),
  }))
}
