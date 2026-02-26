'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  JewelGenRefCategory,
  JewelGenRefImage,
  JewelGenGeneration,
} from '@/lib/types/jewelgen'

// ============================================================
// Reference Categories
// ============================================================

export async function getRefCategories(): Promise<JewelGenRefCategory[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('jewelgen_ref_categories') as any)
    .select('*')
    .order('display_order')

  if (error) throw new Error(error.message)

  // Build hierarchical tree
  const all = (data || []) as JewelGenRefCategory[]
  const topLevel = all.filter((c) => !c.parent_id)
  return topLevel.map((parent) => ({
    ...parent,
    children: all
      .filter((c) => c.parent_id === parent.id)
      .sort((a, b) => a.display_order - b.display_order),
  }))
}

export async function createRefCategory(
  name: string,
  parentId?: string
): Promise<JewelGenRefCategory> {
  const supabase = await createClient()

  // Get next display_order
  const { count } = await (supabase.from('jewelgen_ref_categories') as any)
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', parentId || null)

  const { data, error } = await (supabase.from('jewelgen_ref_categories') as any)
    .insert({
      name,
      parent_id: parentId || null,
      display_order: (count || 0) + 1,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as JewelGenRefCategory
}

export async function deleteRefCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await (supabase.from('jewelgen_ref_categories') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ============================================================
// Reference Images
// ============================================================

export async function getRefImages(
  categoryId: string
): Promise<JewelGenRefImage[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('jewelgen_ref_images') as any)
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as JewelGenRefImage[]
}

export async function createRefImage(
  categoryId: string,
  storagePath: string,
  label?: string
): Promise<JewelGenRefImage> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await (supabase.from('jewelgen_ref_images') as any)
    .insert({
      category_id: categoryId,
      storage_path: storagePath,
      label: label || null,
      created_by: user?.id || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as JewelGenRefImage
}

export async function deleteRefImage(id: string): Promise<void> {
  const supabase = await createClient()

  // Get the image record first to delete from storage
  const { data: img } = await (supabase.from('jewelgen_ref_images') as any)
    .select('storage_path')
    .eq('id', id)
    .single()

  if (img) {
    await supabase.storage
      .from('jewelgen-references')
      .remove([img.storage_path])
  }

  const { error } = await (supabase.from('jewelgen_ref_images') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ============================================================
// Generations
// ============================================================

export async function getGenerations(): Promise<JewelGenGeneration[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('jewelgen_generations') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return (data || []) as JewelGenGeneration[]
}

export async function getSignedUrl(
  bucket: string,
  path: string
): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600)

  if (error) throw new Error(error.message)
  return data.signedUrl
}
