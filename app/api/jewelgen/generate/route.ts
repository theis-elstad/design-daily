export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callGemini, imagePartFromBase64, textPart } from '@/lib/gemini'
import { generatePrompt } from '@/lib/jewelgen-prompts'
import type { GenerationSettings } from '@/lib/types/jewelgen'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    productBase64,
    productMimeType,
    referenceBase64,
    referenceMimeType,
    settings,
  } = (await request.json()) as {
    productBase64: string
    productMimeType: string
    referenceBase64: string
    referenceMimeType: string
    settings: GenerationSettings
  }

  if (!productBase64 || !referenceBase64) {
    return NextResponse.json(
      { error: 'Both product and reference images are required' },
      { status: 400 }
    )
  }

  try {
    const prompt = generatePrompt(settings)
    const variations = settings.variations || 1
    const outputPaths: string[] = []
    const outputImages: Array<{ base64: string; mimeType: string }> = []

    // Generate each variation
    for (let i = 0; i < variations; i++) {
      const parts = [
        imagePartFromBase64(productBase64, productMimeType || 'image/jpeg'),
        imagePartFromBase64(referenceBase64, referenceMimeType || 'image/jpeg'),
        textPart(prompt),
      ]

      const images = await callGemini(parts)
      const result = images[0]

      // Store in Supabase Storage
      const buffer = Uint8Array.from(atob(result.base64), (c) =>
        c.charCodeAt(0)
      )
      const ext = result.mimeType.includes('png') ? 'png' : 'jpg'
      const filePath = `${user.id}/gen-${Date.now()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('jewelgen-outputs')
        .upload(filePath, buffer, {
          contentType: result.mimeType,
        })

      if (uploadError) {
        throw new Error(`Failed to store output: ${uploadError.message}`)
      }

      outputPaths.push(filePath)
      outputImages.push({
        base64: result.base64,
        mimeType: result.mimeType,
      })
    }

    // Save generation record
    const { error: dbError } = await (supabase.from('jewelgen_generations') as any)
      .insert({
        user_id: user.id,
        product_image_path: `uploaded-product`,
        reference_image_path: `uploaded-reference`,
        output_paths: outputPaths,
        prompt,
        settings: settings as any,
        status: 'completed',
      })

    if (dbError) {
      console.error('Failed to save generation record:', dbError)
    }

    return NextResponse.json({
      outputs: outputImages.map((img, i) => ({
        path: outputPaths[i],
        base64: img.base64,
        mimeType: img.mimeType,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
