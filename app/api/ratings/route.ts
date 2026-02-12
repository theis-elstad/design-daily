export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { submissionId, ratings } = body

    if (!submissionId || !ratings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { productivity, quality, convertability } = ratings
    if (!productivity || !quality || !convertability) {
      return NextResponse.json({ error: 'All rating fields are required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Only admins can rate submissions' }, { status: 403 })
    }

    // Upsert the rating (update if exists, insert if not)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('ratings') as any).upsert(
      {
        submission_id: submissionId,
        rated_by: user.id,
        productivity,
        quality,
        convertability,
      },
      {
        onConflict: 'submission_id,rated_by',
      }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
