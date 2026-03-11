export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openAIChat } from '@/lib/openai'

const AD_COPY_SYSTEM = `You are an expert direct-response copywriter for social media ads.

Return a JSON object with exactly this structure:
{
  "headlines": ["string", "string", "string"],
  "primaryTexts": ["string", "string", "string"],
  "descriptions": ["string", "string", "string"]
}

Guidelines:
- headlines: 3 variations, max 30 characters each, punchy and benefit-driven
- primaryTexts: 3 variations, max 125 characters each, hook + benefit + subtle CTA
- descriptions: 3 variations, max 30 characters each, concise benefit statement

Write copy that feels native to social media — conversational, specific, emotionally resonant.`

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { adIdea, brandResearch, productResearch, language = 'English' } = body as {
      adIdea: Record<string, unknown>
      brandResearch: Record<string, unknown>
      productResearch: Record<string, unknown>
      language?: string
    }

    if (!adIdea || !brandResearch || !productResearch) {
      return NextResponse.json(
        { error: 'adIdea, brandResearch, and productResearch are required' },
        { status: 400 }
      )
    }

    const userPrompt = `Write high-converting ad copy in ${language} for this ad concept.

AD CONCEPT:
${JSON.stringify(adIdea, null, 2)}

BRAND CONTEXT:
Brand: ${brandResearch.brandName}
Voice: ${brandResearch.brandVoice}
Value Prop: ${brandResearch.valueProposition}

PRODUCT CONTEXT:
Product: ${productResearch.productName}
Price: ${productResearch.price}
Key Benefits: ${Array.isArray(productResearch.keyBenefits) ? (productResearch.keyBenefits as string[]).join(', ') : ''}
Emotional Triggers: ${Array.isArray(productResearch.emotionalTriggers) ? (productResearch.emotionalTriggers as string[]).join(', ') : ''}`

    const raw = await openAIChat(AD_COPY_SYSTEM, userPrompt, {
      model: 'gpt-4o',
      maxTokens: 1000,
      jsonMode: true,
    })

    let copy: Record<string, string[]>
    try {
      copy = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Failed to parse ad copy' }, { status: 500 })
    }

    return NextResponse.json({ copy })
  } catch (err) {
    console.error('Ad copy error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ad copy generation failed' },
      { status: 500 }
    )
  }
}
