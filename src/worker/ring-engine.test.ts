import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkerOutput } from './types'

beforeAll(() => {
  ;(globalThis as any).self = globalThis
  ;(globalThis as any).location = { origin: 'http://localhost' }
})

let posted: WorkerOutput[]

beforeEach(() => {
  posted = []
  ;(globalThis as any).postMessage = (msg: WorkerOutput) => posted.push(msg)
})

async function loadEngine() {
  vi.resetModules()
  await import('./ring-engine')
}

function send(ring: string, n = 1) {
  ;(globalThis as any).onmessage({ data: { ring, n } } as MessageEvent)
}

describe('ring-engine worker message contract', () => {
  it('computes and posts a gauss ring', async () => {
    await loadEngine()
    send('gauss', 2)

    expect(posted).toHaveLength(1)
    expect(posted[0].ring).toBe('gauss')
    expect(posted[0].points.length).toBeGreaterThan(0)
    expect(posted[0].error).toBeUndefined()
  })

  it('loads and posts the cm dataset on success', async () => {
    ;(globalThis as any).fetch = async () => ({
      ok: true,
      json: async () => ({ points: [1, 2], edges: [0, 1] }),
    })
    await loadEngine()

    send('cm')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(posted).toHaveLength(1)
    expect(posted[0].ring).toBe('cm')
    expect(Array.from(posted[0].points)).toEqual([1, 2])
    expect(posted[0].error).toBeUndefined()
  })

  it('posts an error when the cm dataset fails to load', async () => {
    ;(globalThis as any).fetch = async () => ({ ok: false, status: 500 })
    await loadEngine()

    send('cm')
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(posted).toHaveLength(1)
    expect(posted[0].ring).toBe('cm')
    expect(posted[0].error).toContain('500')
  })
})
