'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { StepIndicator } from '@/components/jewelgen/step-indicator'
import { ProductStep } from '@/components/jewelgen/product-step'
import { ReferenceStep } from '@/components/jewelgen/reference-step'
import { SettingsStep } from '@/components/jewelgen/settings-step'
import { ResultsStep } from '@/components/jewelgen/results-step'
import { fileToBase64 } from '@/lib/image-resize'
import type { ProductImage, GenerationSettings } from '@/lib/types/jewelgen'
import { DEFAULT_SETTINGS } from '@/lib/types/jewelgen'

interface ResultOutput {
  path: string
  base64: string
  mimeType: string
}

export default function JewelGenNewPage() {
  const [step, setStep] = useState(1)
  const [productImage, setProductImage] = useState<ProductImage | null>(null)
  const [referenceImage, setReferenceImage] = useState<ProductImage | null>(null)
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS)
  const [results, setResults] = useState<ResultOutput[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const handleGenerate = async () => {
    if (!productImage || !referenceImage) return

    setGenerating(true)
    setError(undefined)

    try {
      // Convert both images to base64
      const [productBlob, referenceBlob] = await Promise.all([
        fetch(productImage.previewUrl).then((r) => r.blob()),
        fetch(referenceImage.previewUrl).then((r) => r.blob()),
      ])

      const productFile = new File([productBlob], 'product.jpg', {
        type: 'image/jpeg',
      })
      const referenceFile = new File([referenceBlob], 'reference.jpg', {
        type: 'image/jpeg',
      })

      const [productBase64, referenceBase64] = await Promise.all([
        fileToBase64(productFile),
        fileToBase64(referenceFile),
      ])

      const res = await fetch('/api/jewelgen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productBase64,
          productMimeType: 'image/jpeg',
          referenceBase64,
          referenceMimeType: 'image/jpeg',
          settings,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Generation failed')
        setStep(4)
        return
      }

      setResults(data.outputs)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setStep(4)
    } finally {
      setGenerating(false)
    }
  }

  const handleEdit = async (
    base64: string,
    mimeType: string,
    comment: string
  ) => {
    const res = await fetch('/api/jewelgen/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType, comment }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Edit failed')
    }

    // Add edited result to the list
    setResults((prev) => [
      { path: data.path, base64: data.base64, mimeType: data.mimeType },
      ...prev,
    ])
    toast.success('Edit applied')
  }

  const handleStartOver = () => {
    // Clean up object URLs
    if (productImage) URL.revokeObjectURL(productImage.previewUrl)
    if (referenceImage) URL.revokeObjectURL(referenceImage.previewUrl)

    setStep(1)
    setProductImage(null)
    setReferenceImage(null)
    setSettings(DEFAULT_SETTINGS)
    setResults([])
    setError(undefined)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">JewelGen</h1>
        <p className="text-sm text-muted-foreground">
          Generate beautiful jewelry ad images
        </p>
      </div>

      <StepIndicator
        currentStep={step}
        onStepClick={(s) => {
          if (s < step) setStep(s)
        }}
      />

      {step === 1 && (
        <ProductStep
          productImage={productImage}
          onProductImage={setProductImage}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ReferenceStep
          referenceImage={referenceImage}
          onReferenceImage={setReferenceImage}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <SettingsStep
          settings={settings}
          onSettings={setSettings}
          onGenerate={handleGenerate}
          onBack={() => setStep(2)}
          generating={generating}
        />
      )}

      {step === 4 && (
        <ResultsStep
          results={results}
          onEdit={handleEdit}
          onStartOver={handleStartOver}
          error={error}
        />
      )}
    </div>
  )
}
