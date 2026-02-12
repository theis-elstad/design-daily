'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton() {
  const router = useRouter()

  return (
    <Button variant="ghost" size="sm" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to submissions
    </Button>
  )
}
