import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isVideoFile(fileName: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'))
  return videoExtensions.includes(extension)
}

export function isWeekendDate(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  return day === 0 || day === 6
}

const LETTER_AVATAR_COLORS = [
  'bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-amber-500',
  'bg-purple-600', 'bg-orange-500', 'bg-teal-600', 'bg-pink-600',
]

export function getLetterAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return LETTER_AVATAR_COLORS[Math.abs(hash) % LETTER_AVATAR_COLORS.length]
}

/**
 * Convert video duration (seconds) to static-equivalent count using diminishing returns.
 * ~6s → 4.5, ~12s → 7, ~20s → 8.6, ~30s → 9.5 (approaches 10 as cap)
 */
export function videoStaticEquivalent(durationSeconds: number): number {
  return Math.round(10 * (1 - Math.exp(-durationSeconds / 10)) * 10) / 10
}

/**
 * Compute weighted productivity count: statics + video equivalents.
 * Videos without duration default to 15s equivalent.
 */
export function computeWeightedProductivityCount(
  staticCount: number,
  videos: { duration: number | null }[]
): number {
  const videoEquivalent = videos.reduce(
    (sum, v) => sum + videoStaticEquivalent(v.duration || 15),
    0
  )
  return staticCount + videoEquivalent
}

export function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`
}
