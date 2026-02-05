export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { checkTodaySubmission } from '@/lib/actions/submissions'
import { SubmissionForm } from '@/components/submit/submission-form'

export default async function SubmitPage() {
  const profile = await getCurrentUser()

  if (!profile) {
    redirect('/login')
  }

  const { hasSubmitted, existingAssets } = await checkTodaySubmission()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {profile.full_name?.split(' ')[0] || 'Designer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <SubmissionForm
        userId={profile.id}
        hasSubmitted={hasSubmitted}
        existingAssets={existingAssets || []}
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
