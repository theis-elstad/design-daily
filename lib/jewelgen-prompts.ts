import type { GenerationSettings } from '@/lib/types/jewelgen'

// ============================================================
// Default prompt templates (used when no DB override exists)
// ============================================================

const DEFAULT_GENERATE_TEMPLATE = `Create a high-resolution, professional jewelry advertisement photograph. Use the first attached image as the exact product reference — preserve the jewelry piece's design, materials, gemstones, metalwork, and every detail without any alterations or substitutions. Use the second attached image as the style and composition reference — match its lighting, angle, background, mood, and overall aesthetic.

The final image should look like a polished e-commerce or editorial ad featuring the exact product from the first image, styled and shot in the manner of the second image. Ensure realistic reflections, shadows, and material rendering appropriate for jewelry photography. The product must be the clear focal point.{{OVERLAY_INSTRUCTIONS}}{{WILDCARD_INSTRUCTIONS}}`

const DEFAULT_FIX_TEMPLATE = `Clean up this jewelry product image for use in professional advertising. Remove any cluttered or distracting background and replace it with a clean, pure white background. Ensure the jewelry piece is well-lit with soft, even studio lighting that highlights its materials and craftsmanship. Preserve every detail of the product exactly as shown — the design, gemstones, metalwork, color, and proportions must remain completely unchanged. Output a high-resolution product photography image suitable for e-commerce.`

const DEFAULT_EDIT_TEMPLATE = `Modify this jewelry advertisement image based on the following feedback: {{USER_COMMENT}}

Important: preserve the jewelry product's exact design, materials, and details without any alterations unless the feedback specifically requests changes to the product itself. Focus the edits on composition, lighting, background, styling, or other non-product elements unless otherwise directed.`

// ============================================================
// Helpers to build variable substitution strings
// ============================================================

function buildOverlayInstructions(settings: GenerationSettings): string {
  if (settings.overlayText === 'instructions' && settings.overlayContent) {
    return `\n\nAdditional creative direction: ${settings.overlayContent}`
  }
  if (settings.overlayText === 'specific' && settings.overlayContent) {
    return `\n\nInclude the following text overlaid on the image in an elegant, tasteful way that complements the jewelry ad aesthetic: "${settings.overlayContent}"`
  }
  return ''
}

function buildWildcardInstructions(settings: GenerationSettings): string {
  if (settings.wildcard) {
    return `\n\nTake creative freedom with the composition, styling, and environment. Feel free to reimagine the setting, lighting, and presentation in an unexpected and visually striking way — but the jewelry product itself must remain exactly as shown in the first image with no design changes.`
  }
  return ''
}

// ============================================================
// Resolve functions — accept an optional DB template override
// ============================================================

export function resolveGeneratePrompt(
  settings: GenerationSettings,
  dbTemplate: string | null
): string {
  const template = dbTemplate || DEFAULT_GENERATE_TEMPLATE
  return template
    .replace('{{OVERLAY_INSTRUCTIONS}}', buildOverlayInstructions(settings))
    .replace('{{WILDCARD_INSTRUCTIONS}}', buildWildcardInstructions(settings))
}

export function resolveFixPrompt(dbTemplate: string | null): string {
  return dbTemplate || DEFAULT_FIX_TEMPLATE
}

export function resolveEditPrompt(
  userComment: string,
  dbTemplate: string | null
): string {
  const template = dbTemplate || DEFAULT_EDIT_TEMPLATE
  return template.replace('{{USER_COMMENT}}', userComment)
}

// ============================================================
// Remove Jewelry
// ============================================================

const DEFAULT_REMOVE_JEWELRY_TEMPLATE = `Remove all jewelry from this image — including rings, necklaces, bracelets, earrings, watches, and any other accessories. Keep everything else exactly the same: the person, pose, clothing, background, lighting, and composition should remain completely unchanged. The result should look natural, as if no jewelry was ever present. Output a high-resolution image.`

export function resolveRemoveJewelryPrompt(dbTemplate: string | null): string {
  return dbTemplate || DEFAULT_REMOVE_JEWELRY_TEMPLATE
}

// ============================================================
// Legacy wrappers (use hardcoded defaults — no DB)
// ============================================================

export function generatePrompt(settings: GenerationSettings): string {
  return resolveGeneratePrompt(settings, null)
}

export function fixImagePrompt(): string {
  return resolveFixPrompt(null)
}

export function editPrompt(userComment: string): string {
  return resolveEditPrompt(userComment, null)
}
