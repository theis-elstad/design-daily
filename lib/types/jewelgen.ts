export interface JewelGenRefCategory {
  id: string
  name: string
  parent_id: string | null
  display_order: number
  created_at: string
  children?: JewelGenRefCategory[]
}

export interface JewelGenRefImage {
  id: string
  category_id: string
  storage_path: string
  label: string | null
  created_by: string | null
  created_at: string
}

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface JewelGenGeneration {
  id: string
  user_id: string
  product_image_path: string
  reference_image_path: string
  output_paths: string[]
  prompt: string | null
  settings: GenerationSettings
  status: GenerationStatus
  error: string | null
  created_at: string
}

export type OverlayTextMode = 'none' | 'instructions' | 'specific'
export type VariationCount = 1 | 2 | 4

export interface GenerationSettings {
  overlayText: OverlayTextMode
  overlayContent?: string
  variations: VariationCount
  wildcard: boolean
}

export const DEFAULT_SETTINGS: GenerationSettings = {
  overlayText: 'none',
  variations: 1,
  wildcard: false,
}

export interface ProductImage {
  path: string
  previewUrl: string
}

export interface ShopifyProductImage {
  src: string
  width: number
  height: number
  alt: string | null
}

export interface WizardState {
  productImage: ProductImage | null
  referenceImage: ProductImage | null
  settings: GenerationSettings
  results: Array<{ path: string; url: string }>
  status: 'idle' | 'generating' | 'complete' | 'error'
  error?: string
}
