import Anthropic from '@anthropic-ai/sdk'

let _anthropic: Anthropic | null = null

function getClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return _anthropic
}

export async function generateAISummary(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const message = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  return textBlock?.text || ''
}
