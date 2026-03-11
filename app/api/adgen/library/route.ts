export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/adgen/library — Save an ad creative to the library
 * GET  /api/adgen/library — List saved creatives for the current user
 */

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    brandUrl,
    productUrl,
    idea,
    copy,
    imagePrompt,
    generatedBy,
    adFormat,
    imageBase64,
    mimeType,
  } = body as {
    brandUrl: string
    productUrl: string
    idea: Record<string, unknown>
    copy: Record<string, unknown>
    imagePrompt: string
    generatedBy: string
    adFormat: string
    imageBase64: string
    mimeType: string
  }

  if (!idea || !imageBase64) {
    return NextResponse.json({ error: 'idea and imageBase64 are required' }, { status: 400 })
  }

  const { data, error } = await (supabase as any).from('adgen_library').insert({
    id: crypto.randomUUID(),
    user_id: user.id,
    brand_url: brandUrl || null,
    product_url: productUrl || null,
    idea,
    copy,
    image_prompt: imagePrompt,
    generated_by: generatedBy,
    ad_format: adFormat,
    image_base64: imageBase64,
    mime_type: mimeType,
  }).select().single()

  if (error) {
    console.error('Library save error:', error)
    return NextResponse.json({ error: 'Failed to save to library' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, saved: true })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as any)
    .from('adgen_library')
    .select('id, brand_url, product_url, idea, copy, ad_format, generated_by, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Library fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 })
  }

  return NextResponse.json({ items: data })
}
