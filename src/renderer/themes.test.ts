import { describe, it, expect } from 'vitest'
import { getTheme, deriveCustomTheme } from './themes'

describe('getTheme', () => {
  it('returns the named theme palette', () => {
    expect(getTheme('ember').accentColor).toBe('#f97316')
    expect(getTheme('cosmic').bg).toBe('#020a18')
  })

  it('falls back to cosmic for custom without a color', () => {
    expect(getTheme('custom')).toEqual(getTheme('cosmic'))
  })

  it('derives a custom palette when custom color is given', () => {
    expect(getTheme('custom', '#ff0000')).toEqual(deriveCustomTheme('#ff0000'))
  })
})

describe('deriveCustomTheme', () => {
  it('uses the hue derived from the hex color', () => {
    // #ff0000 → hue 0, #00ff00 → hue 120, #0000ff → hue 240
    expect(deriveCustomTheme('#ff0000').edgePrimary).toBe('hsl(0, 90%, 60%)')
    expect(deriveCustomTheme('#00ff00').edgePrimary).toBe('hsl(120, 90%, 60%)')
    expect(deriveCustomTheme('#0000ff').edgePrimary).toBe('hsl(240, 90%, 60%)')
  })
})
