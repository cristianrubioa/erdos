// ℤ[i, √2] algebraic unit-distance graph.
// Points: z=(a+c√2)+(b+d√2)i → (a+c√2, b+d√2)
// Exact unit-distance arithmetic:
// dist² = P + 2Q√2 with P=Δa²+2Δc²+Δb²+2Δd², Q=ΔaΔc+ΔbΔd
// Unit condition: P² − 8Q² = 1 (Pell-type).

const RHO = Math.SQRT2

function isUnitDist(da: number, db: number, dc: number, dd: number): boolean {
  const p = da*da + 2*dc*dc + db*db + 2*dd*dd
  const q = da*dc + db*dd
  return p * p - 8 * q * q === 1
}

export function computeNuevo(n: number): { points: Float32Array<ArrayBuffer>; edges: Uint32Array<ArrayBuffer> } {
  const rho = RHO

  type P4 = readonly [number, number, number, number]
  const pointList: P4[] = []
  const ptCoords: number[] = []
  const rLimit = n * (1 + rho) * 0.85

  for (let a = -n; a <= n; a++) {
    for (let b = -n; b <= n; b++) {
      for (let c = -n; c <= n; c++) {
        for (let d = -n; d <= n; d++) {
          const x = a + c * rho
          const y = b + d * rho
          if (x * x + y * y > rLimit * rLimit) continue
          pointList.push([a, b, c, d])
          ptCoords.push(x, y)
        }
      }
    }
  }

  const total = pointList.length
  const edges: number[] = []
  for (let i = 0; i < total; i++) {
    const [ai, bi, ci, di] = pointList[i]
    for (let j = i + 1; j < total; j++) {
      const [aj, bj, cj, dj] = pointList[j]
      if (isUnitDist(ai - aj, bi - bj, ci - cj, di - dj)) {
        edges.push(i, j)
      }
    }
  }

  return {
    points: new Float32Array(ptCoords),
    edges: new Uint32Array(edges),
  }
}
