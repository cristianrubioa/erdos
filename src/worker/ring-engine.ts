/// <reference lib="webworker" />

import { computeGauss } from './rings/gaussian'
import type { WorkerInput, WorkerOutput } from './types'

type DatasetPayload = { points: number[]; edges: number[] }
type LoadedDataset = {
  points: Float32Array<ArrayBuffer>
  edges: Uint32Array<ArrayBuffer>
}

const DATASET_URL = new URL('/data/cm.json', self.location.origin).toString()
let cmDatasetPromise: Promise<LoadedDataset> | null = null

function loadCmDataset(): Promise<LoadedDataset> {
  if (!cmDatasetPromise) {
    cmDatasetPromise = fetch(DATASET_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load CM dataset: ${res.status}`)
        }
        return res.json() as Promise<DatasetPayload>
      })
      .then((data) => ({
        points: new Float32Array(data.points),
        edges: new Uint32Array(data.edges),
      }))
  }
  return cmDatasetPromise
}

function post(out: WorkerOutput) {
  ;(self as DedicatedWorkerGlobalScope).postMessage(out, [
    out.points.buffer,
    out.edges.buffer,
  ])
}

self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { ring, n } = e.data

  switch (ring) {
    case 'gauss':
      post({ ...computeGauss(n), ring })
      return
    case 'cm':
      loadCmDataset()
        .then((dataset) => post({ ...dataset, ring }))
        .catch((err) => {
          console.error(err)
          post({
            points: new Float32Array(),
            edges: new Uint32Array(),
            ring,
            error: `${err instanceof Error ? err.message : String(err)} (${DATASET_URL})`,
          })
        })
      return
  }
}
