'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSubmissionsForJudging(date?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const targetDate = date || new Date().toISOString().split('T')[0]

  // Get all submissions for the date with their assets and rating status
  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      `
      id,
      submission_date,
      user_id,
      assets (
        id,
        storage_path,
        file_name
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
    .eq('submission_date', targetDate)
    .order('created_at', { ascending: true })

  // Define types for the query result
  type SubmissionForJudging = {
    id: string
    submission_date: string
    user_id: string
    assets: { id: string; storage_path: string; file_name: string }[]
    ratings: { id: string; rated_by: string; productivity: number; quality: number; convertability: number }[]
  }

  const typedSubmissions = (submissions || []) as SubmissionForJudging[]

  // Mark which submissions have been rated by current user
  return typedSubmissions.map((sub) => {
    const myRating = sub.ratings?.find((r) => r.rated_by === user.id)
    return {
      ...sub,
      isRated: !!myRating,
      myRating: myRating || null,
    }
  })
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

  revalidatePath('/judge')
  return { success: true }
}

export async function getJudgingStats(date?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const targetDate = date || new Date().toISOString().split('T')[0]

  // Get total submissions for the date
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('submission_date', targetDate)

  // Get submissions rated by current user for the date
  const { data: ratedSubmissions } = await supabase
    .from('ratings')
    .select('submission_id, submissions!inner(submission_date)')
    .eq('rated_by', user.id)
    .eq('submissions.submission_date', targetDate)

  const ratedCount = ratedSubmissions?.length || 0

  return {
    total: totalSubmissions || 0,
    rated: ratedCount,
    remaining: (totalSubmissions || 0) - ratedCount,
  }
}
