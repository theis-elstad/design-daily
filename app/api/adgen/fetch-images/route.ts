export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ProductImage {
  src: string
  width: number
  height: number
  alt: string | null
}

function extractImages(images: any[]): ProductImage[] {
  return (images || [])
    .filter((img: any) => img.width > 500)
    .map((img: any) => ({
      src: img.src,
      width: img.width,
      height: img.height,
      alt: img.alt || null,
    }))
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

  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    // ── Product URL: /products/{handle} ──
    if (path.match(/\/products\/[^/]+/)) {
      const jsonUrl = `${parsed.origin}${parsed.pathname}.json`
      const response = await fetch(jsonUrl, {
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        const product = data.product
        if (product) {
          return NextResponse.json({
            title: product.title,
            images: extractImages(product.images),
            urlType: 'product',
          })
        }
      }
    }

    // ── Collection URL: /collections/{handle} ──
    const collectionMatch = path.match(/\/collections\/([^/?#]+)/)
    if (collectionMatch) {
      const collectionHandle = collectionMatch[1]

      // Fetch collection products via Shopify JSON API
      const productsUrl = `${parsed.origin}/collections/${collectionHandle}/products.json?limit=50`
      const response = await fetch(productsUrl, {
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        const products = data.products || []

        // Collect first image from each product
        const images: ProductImage[] = []
        for (const product of products) {
          const productImages = product.images || []
          if (productImages.length > 0) {
            const img = productImages[0]
            if (img.width > 500 || !img.width) {
              images.push({
                src: img.src,
                width: img.width || 1000,
                height: img.height || 1000,
                alt: product.title || img.alt || null,
              })
            }
          }
        }

        // Also try to get the collection title
        let collectionTitle: string | null = null
        try {
          const collectionRes = await fetch(
            `${parsed.origin}/collections/${collectionHandle}.json`,
            { headers: { Accept: 'application/json' } }
          )
          if (collectionRes.ok) {
            const collData = await collectionRes.json()
            collectionTitle = collData.collection?.title || null
          }
        } catch {
          // Collection title is optional
        }

        return NextResponse.json({
          title: collectionTitle || collectionHandle.replace(/-/g, ' '),
          images,
          urlType: 'collection',
        })
      }
    }

    // ── Brand URL: homepage or other page — no images to fetch ──
    return NextResponse.json({
      title: null,
      images: [],
      urlType: 'brand',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    )
  }
}
