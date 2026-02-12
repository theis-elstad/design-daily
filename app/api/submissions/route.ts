export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId } = body

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { role: string } | null
    if (typedProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete submissions' }, { status: 403 })
    }

    // Fetch all assets to clean up storage
    const { data: assets } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('submission_id', submissionId)

    type Asset = { storage_path: string }
    const typedAssets = (assets || []) as Asset[]

    // Delete asset files from storage bucket
    if (typedAssets.length > 0) {
      const paths = typedAssets.map((a) => a.storage_path)
      await supabase.storage.from('submissions').remove(paths)
    }

    // Delete the submission (CASCADE handles assets + ratings rows)
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
