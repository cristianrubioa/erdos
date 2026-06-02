export type RingName = 'gauss' | 'cm'
export type ThemeName = 'cosmic' | 'ember' | 'aurora' | 'neon' | 'obsidian' | 'sakura' | 'custom'

export interface WorkerInput {
  ring: RingName
  n: number
}

export interface WorkerOutput {
  points: Float32Array<ArrayBuffer>
  edges: Uint32Array<ArrayBuffer>
  ring: RingName
  error?: string
}
