export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAISummary } from '@/lib/ai'
import { callGemini, textPart } from '@/lib/gemini'

const IMAGE_PROMPT_SYSTEM = `You are a creative director specializing in social media advertising.
Generate a detailed, vivid image generation prompt for an ad creative.

The prompt should describe:
1. The main subject and composition
2. Lighting and mood
3. Color palette that aligns with the brand
4. Style (photorealistic, lifestyle, product-focused, etc.)
5. Any text overlay suggestions

Keep the prompt under 200 words. Do NOT include any text that would appear in the image as overlay — focus purely on the visual.
Return only the image prompt text, no preamble.`

const FORMAT_ASPECT_RATIOS: Record<string, string> = {
  feed_image: '1:1',
  story: '9:16',
  carousel: '1:1',
  video_concept: '16:9',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { adIdea, adCopy, brandResearch, productResearch } = body as {
    adIdea: Record<string, unknown>
    adCopy: { headlines: string[]; primaryTexts: string[]; descriptions: string[] }
    brandResearch: Record<string, unknown>
    productResearch: Record<string, unknown>
  }

  if (!adIdea || !brandResearch || !productResearch) {
    return NextResponse.json(
      { error: 'adIdea, brandResearch, and productResearch are required' },
      { status: 400 }
    )
  }

  const adFormat = (adIdea.adFormat as string) || 'feed_image'
  const aspectRatio = FORMAT_ASPECT_RATIOS[adFormat] ?? '1:1'

  // Step 1: Generate image prompt via Claude
  const imagePromptRequest = `Create an image generation prompt for this ad creative:

AD CONCEPT:
Title: ${adIdea.title}
Messaging Angle: ${adIdea.messagingAngle}
Visual Concept: ${adIdea.visualConcept}
Format: ${adFormat}

BRAND:
Name: ${brandResearch.brandName}
Voice: ${brandResearch.brandVoice}
Personality: ${Array.isArray(brandResearch.brandPersonality) ? (brandResearch.brandPersonality as string[]).join(', ') : ''}

PRODUCT:
Name: ${productResearch.productName}
Type: ${productResearch.productType}

HEADLINE TO FEATURE: ${adCopy?.headlines?.[0] ?? ''}`

  const imagePrompt = await generateAISummary(IMAGE_PROMPT_SYSTEM, imagePromptRequest)

  // Step 2: Generate image via Gemini
  let imageBase64: string | null = null
  let mimeType = 'image/png'
  let generatedBy = 'gemini-pro'

  // Try with gemini-2.0-flash-preview-image-generation first, fall back to 3-pro
  const modelsToTry = ['gemini-2.0-flash-preview-image-generation', 'gemini-3-pro-image-preview']

  for (const model of modelsToTry) {
    try {
      // Temporarily override the model via environment or use callGemini directly
      // callGemini uses the model from lib/gemini.ts — we call it and catch failures
      const images = await callGemini([textPart(imagePrompt)], { aspectRatio })
      if (images.length > 0) {
        imageBase64 = images[0].base64
        mimeType = images[0].mimeType
        generatedBy = model
        break
      }
    } catch (err) {
      // Try next model
      if (model === modelsToTry[modelsToTry.length - 1]) {
        console.error('All Gemini models failed:', err)
      }
    }
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }

  return NextResponse.json({
    imageBase64,
    mimeType,
    imagePrompt,
    generatedBy,
    adFormat,
    timestamp: new Date().toISOString(),
  })
}
