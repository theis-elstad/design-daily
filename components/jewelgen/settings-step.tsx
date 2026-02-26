'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type {
  GenerationSettings,
  OverlayTextMode,
  VariationCount,
} from '@/lib/types/jewelgen'

interface SettingsStepProps {
  settings: GenerationSettings
  onSettings: (settings: GenerationSettings) => void
  onGenerate: () => void
  onBack: () => void
  generating: boolean
}

export function SettingsStep({
  settings,
  onSettings,
  onGenerate,
  onBack,
  generating,
}: SettingsStepProps) {
  const update = (partial: Partial<GenerationSettings>) => {
    onSettings({ ...settings, ...partial })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Generation Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure how the ad should be generated.
        </p>
      </div>

      <div className="space-y-5">
        {/* Overlay text */}
        <div className="space-y-2">
          <Label>Overlay Text</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'none', label: 'None' },
                { value: 'instructions', label: 'Creative Direction' },
                { value: 'specific', label: 'Specific Text' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ overlayText: value })}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  settings.overlayText === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {settings.overlayText === 'instructions' && (
            <Textarea
              placeholder="E.g., warm golden lighting, bokeh background, lifestyle setting on a marble table..."
              value={settings.overlayContent || ''}
              onChange={(e) => update({ overlayContent: e.target.value })}
              rows={3}
            />
          )}
          {settings.overlayText === 'specific' && (
            <Input
              placeholder='E.g., "50% OFF — Limited Time"'
              value={settings.overlayContent || ''}
              onChange={(e) => update({ overlayContent: e.target.value })}
            />
          )}
        </div>

        {/* Variations */}
        <div className="space-y-2">
          <Label>Variations</Label>
          <Select
            value={String(settings.variations)}
            onValueChange={(v) =>
              update({ variations: Number(v) as VariationCount })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            More variations take longer but give you options.
          </p>
        </div>

        {/* Wildcard */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.wildcard}
              onChange={(e) => update({ wildcard: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm font-medium">Wildcard Mode</span>
          </label>
          <p className="text-xs text-muted-foreground pl-6">
            Give the AI creative freedom with the setting and composition. The
            product design stays the same.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={generating}>
          Back
        </Button>
        <Button onClick={onGenerate} disabled={generating} className="flex-1">
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </div>
    </div>
  )
}
