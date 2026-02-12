'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
      profiles!inner (
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
    .limit(100)

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
  return typedSubmissions.map((sub) => {
    const myRating = sub.ratings?.find((r) => r.rated_by === user.id)

    let status: 'needs_review' | 'rated' | 'edited' = 'needs_review'
    if (myRating) {
      if (sub.updated_at && new Date(sub.updated_at) > new Date(myRating.created_at)) {
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
      profiles!inner (
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
    ratings: { id: string; rated_by: string; productivity: number; quality: number; created_at: string }[]
  }

  const sub = data as SubmissionResult
  const myRating = sub.ratings?.find((r) => r.rated_by === user.id)

  let status: 'needs_review' | 'rated' | 'edited' = 'needs_review'
  if (myRating) {
    if (sub.updated_at && new Date(sub.updated_at) > new Date(myRating.created_at)) {
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
  let ratedQuery = supabase
    .from('ratings')
    .select('submission_id, created_at, submissions!inner(submission_date, updated_at)')
    .eq('rated_by', user.id)

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

  // Only count as "rated" if the submission hasn't been edited after the rating
  const fullyRatedCount = typedRated.filter((r) => {
    const updatedAt = r.submissions?.updated_at
    if (!updatedAt) return true
    return new Date(updatedAt) <= new Date(r.created_at)
  }).length

  return {
    total: totalSubmissions || 0,
    rated: fullyRatedCount,
    remaining: (totalSubmissions || 0) - fullyRatedCount,
  }
}
