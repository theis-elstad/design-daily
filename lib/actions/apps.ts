'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { App } from '@/lib/types/database'

export async function getVisibleApps(): Promise<App[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase.from('apps') as any)
    .select('*')
    .is('deleted_at', null)
    .neq('status', 'hidden')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching visible apps:', error)
    return []
  }

  return data || []
}

export async function getAllApps(): Promise<App[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase.from('apps') as any)
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all apps:', error)
    return []
  }

  return data || []
}

export async function createApp(appData: {
  name: string
  slug: string
  description: string
  url: string
  icon_url?: string | null
  status?: string
  open_in_new_tab?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get next display_order
  const { data: lastApp } = await (supabase.from('apps') as any)
    .select('display_order')
    .is('deleted_at', null)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (lastApp?.display_order ?? 0) + 1

  const { error } = await (supabase.from('apps') as any).insert({
    ...appData,
    display_order: nextOrder,
    icon_url: appData.icon_url || null,
    status: appData.status || 'active',
    open_in_new_tab: appData.open_in_new_tab ?? true,
  })

  if (error) {
    console.error('Error creating app:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/home')
  revalidatePath('/admin')
  return { success: true }
}

export async function updateApp(
  id: string,
  appData: Partial<{
    name: string
    slug: string
    description: string
    url: string
    icon_url: string | null
    status: string
    display_order: number
    open_in_new_tab: boolean
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await (supabase.from('apps') as any)
    .update({ ...appData, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating app:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/home')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteApp(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await (supabase.from('apps') as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting app:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/home')
  revalidatePath('/admin')
  return { success: true }
}

export async function restoreApp(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await (supabase.from('apps') as any)
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error restoring app:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/home')
  revalidatePath('/admin')
  return { success: true }
}

export async function reorderApps(
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await (supabase.from('apps') as any)
      .update({ display_order: i + 1, updated_at: new Date().toISOString() })
      .eq('id', orderedIds[i])

    if (error) {
      console.error('Error reordering apps:', error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/home')
  revalidatePath('/admin')
  return { success: true }
}
