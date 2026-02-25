export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAISummary } from '@/lib/ai'
import { designerFeedbackPrompt } from '@/lib/ai-prompts'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { full_name: string | null } | null
    const designerName = typedProfile?.full_name || 'Designer'

    // Get recent submissions with ratings
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        submission_date,
        comment,
        assets (id, asset_type),
        ratings (productivity, quality, comment)
      `)
      .eq('user_id', user.id)
      .order('submission_date', { ascending: false })
      .limit(30)

    type SubResult = {
      submission_date: string
      comment: string | null
      assets: { id: string; asset_type: 'image' | 'video' }[]
      ratings: { productivity: number; quality: number; comment: string | null }[]
    }

    const typedSubs = (submissions || []) as SubResult[]

    if (typedSubs.length === 0) {
      return NextResponse.json({ error: 'No submissions found to analyze' }, { status: 400 })
    }

    const submissionData = typedSubs.map((s) => ({
      date: s.submission_date,
      staticCount: s.assets?.filter((a) => a.asset_type === 'image').length || 0,
      videoCount: s.assets?.filter((a) => a.asset_type === 'video').length || 0,
      productivity: s.ratings?.[0]?.productivity ?? null,
      quality: s.ratings?.[0]?.quality ?? null,
      judgeComment: s.ratings?.[0]?.comment ?? null,
      designerComment: s.comment,
    }))

    const { system, user: userPrompt } = designerFeedbackPrompt(designerName, submissionData)

    const content = await generateAISummary(system, userPrompt)

    // Store in ai_summaries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: summary, error } = await (supabase.from('ai_summaries') as any)
      .insert({
        type: 'designer_feedback',
        target_user_id: user.id,
        generated_by: user.id,
        content,
        metadata: { submission_count: submissionData.length },
      })
      .select('id, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: summary.id,
      content,
      createdAt: summary.created_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
