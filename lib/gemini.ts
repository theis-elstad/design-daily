const GEMINI_MODEL = 'gemini-3-pro-image-preview'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set')
  return key
}

export interface GeminiImagePart {
  inlineData: {
    mimeType: string
    data: string // base64
  }
}

export interface GeminiTextPart {
  text: string
}

type GeminiPart = GeminiImagePart | GeminiTextPart

interface GeminiRequest {
  contents: Array<{
    parts: GeminiPart[]
  }>
  generationConfig: {
    responseModalities: string[]
    imageConfig?: {
      aspectRatio?: string
      imageSize?: string
    }
  }
}

interface GeminiResponsePart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[]
    }
  }>
}

export interface GeneratedImage {
  base64: string
  mimeType: string
}

/**
 * Call the Gemini API with image and text parts.
 * Returns generated images from the response.
 */
export async function callGemini(
  parts: GeminiPart[],
  options?: { aspectRatio?: string }
): Promise<GeneratedImage[]> {
  const requestBody: GeminiRequest = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: options?.aspectRatio || '1:1',
        imageSize: '2K',
      },
    },
  }

  let bodyString = JSON.stringify(requestBody)

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': getApiKey(),
    },
    body: bodyString,
  })

  // Release request body for GC
  bodyString = ''

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errorText}`)
  }

  const data: GeminiResponse = await response.json()
  const candidateParts = data.candidates?.[0]?.content?.parts

  if (!candidateParts) {
    throw new Error('No content in Gemini response')
  }

  const images: GeneratedImage[] = []
  for (const part of candidateParts) {
    if (part.inlineData) {
      images.push({
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      })
    }
  }

  if (images.length === 0) {
    throw new Error('No images in Gemini response')
  }

  return images
}

/**
 * Build an inline image part from a base64 string.
 */
export function imagePartFromBase64(
  base64: string,
  mimeType: string = 'image/jpeg'
): GeminiImagePart {
  return {
    inlineData: { mimeType, data: base64 },
  }
}

/**
 * Build a text part.
 */
export function textPart(text: string): GeminiTextPart {
  return { text }
}
