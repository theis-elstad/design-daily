import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { Header } from '@/components/layout/header'

export const runtime = 'edge'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentUser()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header profile={profile} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
