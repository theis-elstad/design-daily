export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/actions/auth'
import { checkSubmission } from '@/lib/actions/submissions'
import { SubmissionForm } from '@/components/submit/submission-form'
import { DateSelector } from '@/components/submit/date-selector'

interface SubmitPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const profile = await getCurrentUser()

  if (!profile) {
    redirect('/login')
  }

  const params = await searchParams
  const { hasSubmitted, existingAssets, currentDate } = await checkSubmission(params.date)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {profile.full_name?.split(' ')[0] || 'Designer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Submit your design work for the day.
        </p>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <Suspense fallback={<div className="h-16" />}>
          <DateSelector currentDate={currentDate} />
        </Suspense>
      </div>

      <SubmissionForm
        userId={profile.id}
        hasSubmitted={hasSubmitted}
        existingAssets={existingAssets || []}
        selectedDate={currentDate}
      />
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
