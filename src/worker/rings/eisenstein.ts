// Eisenstein integers ℤ[ω], ω=e^(2πi/3): z=a+bω → (a-b/2, b·√3/2)
// The 6 unit elements of ℤ[ω] as (Δa,Δb) pairs:
//   ±1=(±1,0), ±ω=(0,±1), ±ω²=(∓1,∓1) since ω²=-1-ω
// Half-directions (avoid double-counting): (1,0), (0,1), (1,1)
// Verification: (1,1) → Δx=1-0.5=0.5, Δy=√3/2 → dist²=0.25+0.75=1 ✓

const SQRT3_HALF = Math.sqrt(3) / 2

export function computeEisenstein(n: number): { points: Float32Array<ArrayBuffer>; edges: Uint32Array<ArrayBuffer> } {
  const pts: number[] = []
  const indexMap = new Map<string, number>()

  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      indexMap.set(`${a},${b}`, pts.length >> 1)
      pts.push(a - b * 0.5, b * SQRT3_HALF)
    }
  }

  const edges: number[] = []
  const halfDirs: [number, number][] = [[1, 0], [0, 1], [1, 1]]

  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      const i = indexMap.get(`${a},${b}`)!
      for (const [da, db] of halfDirs) {
        const nb = indexMap.get(`${a + da},${b + db}`)
        if (nb !== undefined) edges.push(i, nb)
      }
    }
  }

  return {
    points: new Float32Array(pts),
    edges: new Uint32Array(edges),
  }
}
