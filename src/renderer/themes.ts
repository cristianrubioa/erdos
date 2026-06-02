import type { ThemeName } from '../worker/types'

export interface Palette {
  bg: string
  edgePrimary: string
  edgeSecondary: string
  nodeColor: string
  glowColor: string
  accentColor: string
}

const THEMES: Record<Exclude<ThemeName, 'custom'>, Palette> = {
  cosmic: {
    bg:          '#020a18',
    edgePrimary: '#3b82f6',
    edgeSecondary:'#06b6d4',
    nodeColor:   '#e2e8f0',
    glowColor:   '#60a5fa',
    accentColor: '#3b82f6',
  },
  ember: {
    bg:          '#0c0500',
    edgePrimary: '#f97316',
    edgeSecondary:'#fbbf24',
    nodeColor:   '#fef3c7',
    glowColor:   '#fb923c',
    accentColor: '#f97316',
  },
  aurora: {
    bg:          '#011008',
    edgePrimary: '#10b981',
    edgeSecondary:'#a78bfa',
    nodeColor:   '#d1fae5',
    glowColor:   '#34d399',
    accentColor: '#10b981',
  },
  neon: {
    bg:          '#000000',
    edgePrimary: '#ec4899',
    edgeSecondary:'#f43f5e',
    nodeColor:   '#ffffff',
    glowColor:   '#f472b6',
    accentColor: '#ec4899',
  },
  obsidian: {
    bg:          '#111111',
    edgePrimary: '#94a3b8',
    edgeSecondary:'#e2e8f0',
    nodeColor:   '#ffffff',
    glowColor:   '#cbd5e1',
    accentColor: '#94a3b8',
  },
  sakura: {
    bg:          '#0a0510',
    edgePrimary: '#f472b6',
    edgeSecondary:'#e879f9',
    nodeColor:   '#fce7f3',
    glowColor:   '#f9a8d4',
    accentColor: '#f472b6',
  },
}

// Derive a palette from a single CSS hue (0-360)
export function deriveCustomTheme(cssColor: string): Palette {
  // Parse hex color to get hue
  const r = parseInt(cssColor.slice(1, 3), 16) / 255
  const g = parseInt(cssColor.slice(3, 5), 16) / 255
  const b = parseInt(cssColor.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  if (max !== min) {
    const d = max - min
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  const hue = Math.round(h * 360)
  const edge = `hsl(${hue}, 90%, 60%)`
  const glow = `hsl(${hue}, 80%, 70%)`
  const node = `hsl(${hue}, 20%, 92%)`
  const sec  = `hsl(${(hue + 30) % 360}, 90%, 65%)`
  return {
    bg: '#060208',
    edgePrimary: edge,
    edgeSecondary: sec,
    nodeColor: node,
    glowColor: glow,
    accentColor: edge,
  }
}

export function getTheme(name: ThemeName, customColor?: string): Palette {
  if (name === 'custom' && customColor) return deriveCustomTheme(customColor)
  if (name === 'custom') return THEMES.cosmic
  return THEMES[name]
}
