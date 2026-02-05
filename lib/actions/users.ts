'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data || []
}

export async function updateUserRole(userId: string, newRole: 'designer' | 'admin') {
  const supabase = await createClient()

  // Check if current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const typedProfile = currentUserProfile as { role: string } | null
  if (typedProfile?.role !== 'admin') {
    return { success: false, error: 'Not authorized' }
  }

  // Prevent demoting yourself
  if (userId === user.id && newRole === 'designer') {
    return { success: false, error: 'Cannot demote yourself' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({ role: newRole })
    .eq('id', userId)

  if (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

// Allowed email domains management
export async function getAllowedDomains() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('allowed_domains') as any)
    .select('*')
    .order('domain', { ascending: true })

  if (error) {
    console.error('Error fetching allowed domains:', error)
    return []
  }

  return data || []
}

export async function addAllowedDomain(domain: string) {
  const supabase = await createClient()

  // Normalize domain (lowercase, trim)
  const normalizedDomain = domain.toLowerCase().trim()

  if (!normalizedDomain || !normalizedDomain.includes('.')) {
    return { success: false, error: 'Invalid domain format' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('allowed_domains') as any)
    .insert({ domain: normalizedDomain })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Domain already exists' }
    }
    console.error('Error adding domain:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function removeAllowedDomain(domainId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('allowed_domains') as any)
    .delete()
    .eq('id', domainId)

  if (error) {
    console.error('Error removing domain:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function isEmailDomainAllowed(email: string): Promise<boolean> {
  const supabase = await createClient()

  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('allowed_domains') as any)
    .select('id')
    .eq('domain', domain)
    .single()

  if (error || !data) {
    return false
  }

  return true
}
