'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { isVideoFile } from '@/lib/utils'

// Helper to get server's current date (UTC)
function getServerDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper to validate a date is within allowed range (up to 7 days ago)
function isDateInRange(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 7
}

export async function checkSubmission(targetDate?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasSubmitted: false, submissionId: null, currentDate: getServerDate() }

  // Use provided date or server's current date
  const date = targetDate || getServerDate()

  const { data } = await supabase
    .from('submissions')
    .select('id, comment, assets(*)')
    .eq('user_id', user.id)
    .eq('submission_date', date)
    .single()

  type SubmissionWithAssets = {
    id: string
    comment: string | null
    assets: { id: string; submission_id: string; storage_path: string; file_name: string; file_size: number | null; asset_type?: 'image' | 'video'; created_at: string }[]
  }

  const typedData = data as SubmissionWithAssets | null

  // Ensure asset_type is present (infer from filename if not in DB yet)
  const assetsWithType = (typedData?.assets || []).map((asset) => ({
    ...asset,
    asset_type: asset.asset_type || (isVideoFile(asset.file_name) ? 'video' : 'image') as 'image' | 'video',
  }))

  return {
    hasSubmitted: !!typedData,
    submissionId: typedData?.id || null,
    existingAssets: assetsWithType,
    existingComment: typedData?.comment || null,
    currentDate: date,
  }
}

// Keep old function name for backwards compatibility
export async function checkTodaySubmission() {
  return checkSubmission()
}

export async function createSubmission(assetPaths: string[], targetDate?: string, comment?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Use provided date or server's current date
  const date = targetDate || getServerDate()

  // Validate date is within allowed range
  if (targetDate && !isDateInRange(targetDate)) {
    return { error: 'Cannot submit for dates more than 7 days ago or in the future' }
  }

  // Trim comment, treat empty string as null
  const trimmedComment = comment?.trim() || null

  // Check if already submitted for this date
  const { hasSubmitted, submissionId: existingId } = await checkSubmission(date)

  let submissionId = existingId

  if (!hasSubmitted) {
    // Create new submission with explicit date and optional comment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: submission, error: submitError } = await (supabase.from('submissions') as any)
      .insert({ user_id: user.id, submission_date: date, comment: trimmedComment })
      .select()
      .single()

    if (submitError) {
      return { error: submitError.message }
    }
    submissionId = submission.id
  } else if (submissionId && trimmedComment !== undefined) {
    // Update comment on existing submission
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('submissions') as any)
      .update({ comment: trimmedComment })
      .eq('id', submissionId)
  }

  if (!submissionId) {
    return { error: 'Failed to create submission' }
  }

  // Create asset records
  const assets = assetPaths.map((path) => {
    const fileName = path.split('/').pop() || 'unknown'
    return {
      submission_id: submissionId,
      storage_path: path,
      file_name: fileName,
      asset_type: isVideoFile(fileName) ? 'video' : 'image',
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: assetsError } = await (supabase.from('assets') as any).insert(assets)

  if (assetsError) {
    return { error: assetsError.message }
  }

  revalidatePath('/submit')
  return { success: true, submissionId }
}

export async function updateComment(submissionId: string, comment: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const trimmedComment = comment.trim() || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('submissions') as any)
    .update({ comment: trimmedComment })
    .eq('id', submissionId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/submit')
  return { success: true }
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
