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
        convertability
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
    profiles: { full_name: string | null }
    assets: { id: string; storage_path: string; file_name: string; asset_type: 'image' | 'video' }[]
    ratings: { id: string; rated_by: string; productivity: number; quality: number; convertability: number }[]
  }

  const typedSubmissions = (submissions || []) as SubmissionForJudging[]

  // Mark which submissions have been rated by current user and compute counts
  return typedSubmissions.map((sub) => {
    const myRating = sub.ratings?.find((r) => r.rated_by === user.id)
    return {
      id: sub.id,
      submission_date: sub.submission_date,
      user_id: sub.user_id,
      comment: sub.comment,
      submitterName: sub.profiles?.full_name || 'Unknown',
      imageCount: sub.assets?.filter((a) => a.asset_type === 'image').length || 0,
      videoCount: sub.assets?.filter((a) => a.asset_type === 'video').length || 0,
      assets: sub.assets || [],
      isRated: !!myRating,
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
        convertability
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
    profiles: { full_name: string | null }
    assets: { id: string; storage_path: string; file_name: string; asset_type: 'image' | 'video' }[]
    ratings: { id: string; rated_by: string; productivity: number; quality: number; convertability: number }[]
  }

  const sub = data as SubmissionResult
  const myRating = sub.ratings?.find((r) => r.rated_by === user.id)

  return {
    id: sub.id,
    submission_date: sub.submission_date,
    user_id: sub.user_id,
    comment: sub.comment,
    submitterName: sub.profiles?.full_name || 'Unknown',
    imageCount: sub.assets?.filter((a) => a.asset_type === 'image').length || 0,
    videoCount: sub.assets?.filter((a) => a.asset_type === 'video').length || 0,
    assets: sub.assets || [],
    isRated: !!myRating,
    myRating: myRating || null,
  }
}

export async function submitRating(
  submissionId: string,
  ratings: {
    productivity: number
    quality: number
    convertability: number
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
      convertability: ratings.convertability,
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

  // Build rated submissions query
  let ratedQuery = supabase
    .from('ratings')
    .select('submission_id, submissions!inner(submission_date)')
    .eq('rated_by', user.id)

  if (date) {
    ratedQuery = ratedQuery.eq('submissions.submission_date', date)
  }

  const { data: ratedSubmissions } = await ratedQuery

  const ratedCount = ratedSubmissions?.length || 0

  return {
    total: totalSubmissions || 0,
    rated: ratedCount,
    remaining: (totalSubmissions || 0) - ratedCount,
  }
}
