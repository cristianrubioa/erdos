/// <reference lib="webworker" />
import type { WorkerInput, WorkerOutput } from './types'
import { computeGauss } from './rings/gaussian'

type DatasetPayload = { points: number[]; edges: number[] }
type LoadedDataset = { points: Float32Array<ArrayBuffer>; edges: Uint32Array<ArrayBuffer> }

const DATASET_URL = new URL('/data/cm.json', self.location.origin).toString()
let cmDatasetPromise: Promise<LoadedDataset> | null = null

function loadCmDataset(): Promise<LoadedDataset> {
  if (!cmDatasetPromise) {
    cmDatasetPromise = fetch(DATASET_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load CM dataset: ${res.status}`)
        }
        return res.json() as Promise<DatasetPayload>
      })
      .then(data => ({
        points: new Float32Array(data.points),
        edges: new Uint32Array(data.edges),
      }))
  }
  return cmDatasetPromise
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { ring, n } = e.data
  let result: { points: Float32Array<ArrayBuffer>; edges: Uint32Array<ArrayBuffer> }

  switch (ring) {
    case 'gauss':
      result = computeGauss(n)
      break
    case 'cm':
      loadCmDataset()
        .then(dataset => {
          const out: WorkerOutput = { ...dataset, ring }
          ;(self as DedicatedWorkerGlobalScope).postMessage(out, [out.points.buffer, out.edges.buffer])
        })
        .catch(err => {
          console.error(err)
          const out: WorkerOutput = {
            points: new Float32Array(),
            edges: new Uint32Array(),
            ring,
            error: `${err instanceof Error ? err.message : String(err)} (${DATASET_URL})`,
          }
          ;(self as DedicatedWorkerGlobalScope).postMessage(out, [out.points.buffer, out.edges.buffer])
        })
      return
  }

  const out: WorkerOutput = { ...result, ring }
  ;(self as DedicatedWorkerGlobalScope).postMessage(out, [out.points.buffer, out.edges.buffer])
}
