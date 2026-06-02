import { render, type RenderConfig } from '../renderer/canvas-renderer'
import type { RingName, ThemeName } from '../worker/types'

export interface ExportConfig extends RenderConfig {
  ring: RingName
  theme: ThemeName
}

export type ExportFormat = 'phone' | 'desktop' | { w: number; h: number }

export function exportPNG(
  points: Float32Array,
  edges: Uint32Array,
  config: ExportConfig,
  format: ExportFormat,
): void {
  let w: number, h: number, label: string

  if (format === 'phone')   { w = 2160; h = 3840; label = 'phone' }
  else if (format === 'desktop') { w = 3840; h = 2160; label = 'desktop' }
  else {
    w = format.w; h = format.h
    label = `${w}x${h}`
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  render(ctx, points, edges, { ...config, showStats: false })

  const filename = `erdos-${config.ring}-${config.theme}-${label}.png`
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }, 'image/png')
}
