import { describe, it, expect } from 'vitest'
import { computeGauss } from './gaussian'

describe('computeGauss', () => {
  const samples = [1, 3, 10]

  it('returns (2n+1)² points', () => {
    for (const n of samples) {
      const { points } = computeGauss(n)
      expect(points.length / 2).toBe((2 * n + 1) ** 2)
    }
  })

  it('returns 4n(2n+1) edges', () => {
    for (const n of samples) {
      const { edges } = computeGauss(n)
      expect(edges.length / 2).toBe(4 * n * (2 * n + 1))
    }
  })

  it('every edge has length exactly 1', () => {
    for (const n of samples) {
      const { points, edges } = computeGauss(n)
      for (let i = 0; i < edges.length; i += 2) {
        const a = edges[i], b = edges[i + 1]
        const dx = points[a * 2] - points[b * 2]
        const dy = points[a * 2 + 1] - points[b * 2 + 1]
        expect(dx * dx + dy * dy).toBe(1)
      }
    }
  })
})
