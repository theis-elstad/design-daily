import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUser()

  if (!profile || profile.role !== 'admin') {
    redirect('/leaderboard')
  }

  return <>{children}</>
}
