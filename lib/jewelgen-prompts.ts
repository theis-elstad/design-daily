import type { GenerationSettings } from '@/lib/types/jewelgen'

/**
 * Main generation prompt: combine product jewelry image with a reference/style image.
 */
export function generatePrompt(settings: GenerationSettings): string {
  const base = `Create a high-resolution, professional jewelry advertisement photograph. Use the first attached image as the exact product reference — preserve the jewelry piece's design, materials, gemstones, metalwork, and every detail without any alterations or substitutions. Use the second attached image as the style and composition reference — match its lighting, angle, background, mood, and overall aesthetic.

The final image should look like a polished e-commerce or editorial ad featuring the exact product from the first image, styled and shot in the manner of the second image. Ensure realistic reflections, shadows, and material rendering appropriate for jewelry photography. The product must be the clear focal point.`

  let prompt = base

  if (settings.overlayText === 'instructions' && settings.overlayContent) {
    prompt += `\n\nAdditional creative direction: ${settings.overlayContent}`
  } else if (settings.overlayText === 'specific' && settings.overlayContent) {
    prompt += `\n\nInclude the following text overlaid on the image in an elegant, tasteful way that complements the jewelry ad aesthetic: "${settings.overlayContent}"`
  }

  if (settings.wildcard) {
    prompt += `\n\nTake creative freedom with the composition, styling, and environment. Feel free to reimagine the setting, lighting, and presentation in an unexpected and visually striking way — but the jewelry product itself must remain exactly as shown in the first image with no design changes.`
  }

  return prompt
}

/**
 * Fix/clean up a product image — remove messy backgrounds, enhance quality.
 */
export function fixImagePrompt(): string {
  return `Clean up this jewelry product image for use in professional advertising. Remove any cluttered or distracting background and replace it with a clean, pure white background. Ensure the jewelry piece is well-lit with soft, even studio lighting that highlights its materials and craftsmanship. Preserve every detail of the product exactly as shown — the design, gemstones, metalwork, color, and proportions must remain completely unchanged. Output a high-resolution product photography image suitable for e-commerce.`
}

/**
 * Edit a generated image based on user feedback.
 */
export function editPrompt(userComment: string): string {
  return `Modify this jewelry advertisement image based on the following feedback: ${userComment}

Important: preserve the jewelry product's exact design, materials, and details without any alterations unless the feedback specifically requests changes to the product itself. Focus the edits on composition, lighting, background, styling, or other non-product elements unless otherwise directed.`
}
