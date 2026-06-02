// Gaussian integers ℤ[i]: z = a+bi → point (a, b)
// Unit distance edges: only pairs differing by (±1,0) or (0,±1) — exact, no float.
export function computeGauss(n: number): { points: Float32Array<ArrayBuffer>; edges: Uint32Array<ArrayBuffer> } {
  const pts: number[] = []
  const indexMap = new Map<string, number>()

  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      indexMap.set(`${a},${b}`, pts.length >> 1)
      pts.push(a, b)
    }
  }

  const edges: number[] = []
  const dirs: [number, number][] = [[1, 0], [0, 1]]

  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      const i = indexMap.get(`${a},${b}`)!
      for (const [da, db] of dirs) {
        const nb = indexMap.get(`${a + da},${b + db}`)
        if (nb !== undefined) { edges.push(i, nb) }
      }
    }
  }

  return {
    points: new Float32Array(pts),
    edges: new Uint32Array(edges),
  }
}
