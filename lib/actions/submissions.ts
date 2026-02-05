'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function checkTodaySubmission() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasSubmitted: false, submissionId: null }

  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('submissions')
    .select('id, assets(*)')
    .eq('user_id', user.id)
    .eq('submission_date', today)
    .single()

  type SubmissionWithAssets = {
    id: string
    assets: { id: string; submission_id: string; storage_path: string; file_name: string; file_size: number | null; created_at: string }[]
  }

  const typedData = data as SubmissionWithAssets | null

  return {
    hasSubmitted: !!typedData,
    submissionId: typedData?.id || null,
    existingAssets: typedData?.assets || [],
  }
}

export async function createSubmission(assetPaths: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if already submitted today
  const { hasSubmitted, submissionId: existingId } = await checkTodaySubmission()

  let submissionId = existingId

  if (!hasSubmitted) {
    // Create new submission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: submission, error: submitError } = await (supabase.from('submissions') as any)
      .insert({ user_id: user.id })
      .select()
      .single()

    if (submitError) {
      return { error: submitError.message }
    }
    submissionId = submission.id
  }

  if (!submissionId) {
    return { error: 'Failed to create submission' }
  }

  // Create asset records
  const assets = assetPaths.map((path, index) => ({
    submission_id: submissionId,
    storage_path: path,
    file_name: path.split('/').pop() || 'unknown',
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: assetsError } = await (supabase.from('assets') as any).insert(assets)

  if (assetsError) {
    return { error: assetsError.message }
  }

  revalidatePath('/submit')
  return { success: true, submissionId }
}

export async function deleteAsset(assetId: string, storagePath: string) {
  const supabase = await createClient()

  // Delete from storage
  await supabase.storage.from('submissions').remove([storagePath])

  // Delete from database
  const { error } = await supabase.from('assets').delete().eq('id', assetId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/submit')
  return { success: true }
}
