export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, imagePartFromBase64, textPart } from '@/lib/gemini'
import { editPrompt } from '@/lib/jewelgen-prompts'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { imageBase64, mimeType, comment } = await request.json()

  if (!imageBase64 || !comment) {
    return NextResponse.json(
      { error: 'Image and comment are required' },
      { status: 400 }
    )
  }

  try {
    const parts = [
      imagePartFromBase64(imageBase64, mimeType || 'image/jpeg'),
      textPart(editPrompt(comment)),
    ]

    const images = await callGemini(parts)
    const result = images[0]

    // Store the edited image
    const buffer = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0))
    const ext = result.mimeType.includes('png') ? 'png' : 'jpg'
    const filePath = `${user.id}/edit-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('jewelgen-outputs')
      .upload(filePath, buffer, {
        contentType: result.mimeType,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to store edited image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      path: filePath,
      base64: result.base64,
      mimeType: result.mimeType,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Edit failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
