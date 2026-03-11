import OpenAI from 'openai'

let _openai: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }
  return _openai
}

/**
 * Helper: call OpenAI chat with a system + user prompt, return the text response.
 */
export async function openAIChat(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string
    maxTokens?: number
    jsonMode?: boolean
  }
): Promise<string> {
  const client = getOpenAIClient()
  const response = await client.chat.completions.create({
    model: options?.model ?? 'gpt-4o',
    max_tokens: options?.maxTokens ?? 2048,
    response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}
