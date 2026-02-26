export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ShopifyImage {
  src: string
  width: number
  height: number
  alt: string | null
}

function isValidProductUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.pathname.includes('/products/')
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  if (!isValidProductUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid product URL. URL must contain /products/ in the path.' },
      { status: 400 }
    )
  }

  try {
    const parsed = new URL(url)
    const jsonUrl = `${parsed.origin}${parsed.pathname}.json`

    const response = await fetch(jsonUrl, {
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch product data (${response.status})` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const product = data.product

    if (!product) {
      return NextResponse.json(
        { error: 'No product found at this URL' },
        { status: 404 }
      )
    }

    const images: ShopifyImage[] = (product.images || [])
      .filter((img: any) => img.width > 500)
      .map((img: any) => ({
        src: img.src,
        width: img.width,
        height: img.height,
        alt: img.alt || null,
      }))

    return NextResponse.json({
      title: product.title,
      images,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    )
  }
}
