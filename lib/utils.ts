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

export function getAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath) return undefined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`
}
