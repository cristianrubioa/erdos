import type { Palette } from './themes'

export interface RenderConfig {
  palette: Palette
  scale: number
  angleDeg: number
  glow: number
  showStats?: boolean
}

export function render(
  ctx: CanvasRenderingContext2D,
  points: Float32Array,
  edges: Uint32Array,
  config: RenderConfig,
): void {
  const { palette, scale, angleDeg, glow, showStats = true } = config
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const minDim = Math.min(W, H)

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, W, H)

  if (points.length === 0) return

  // Auto-fit bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i], y = points[i + 1]
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  const cxMath = (minX + maxX) / 2
  const cyMath = (minY + maxY) / 2
  const spanMax = Math.max(maxX - minX, maxY - minY) || 1
  const fitScale = (minDim * 0.44) / spanMax
  const totalScale = fitScale * scale

  // Project math → screen coordinates (manual transform, no ctx.save scaling)
  const angle = (angleDeg * Math.PI) / 180
  const cosA = Math.cos(angle), sinA = Math.sin(angle)
  const n = points.length >> 1
  const sx = new Float32Array(n)
  const sy = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    const mx = points[i * 2] - cxMath
    const my = points[i * 2 + 1] - cyMath
    const rx = mx * cosA - my * sinA
    const ry = mx * sinA + my * cosA
    sx[i] = W / 2 + rx * totalScale
    sy[i] = H / 2 - ry * totalScale    // flip Y so math up = visual up
  }

  // Sizes in actual screen pixels
  const edgeW  = Math.max(0.6, Math.min(1.8, totalScale * 0.025))
  const nodeR  = Math.max(1.2, Math.min(5, totalScale * 0.055))
  const glowW  = edgeW + glow * 0.25
  const blur   = glow * 1.8             // shadow blur in CSS/screen pixels

  // Helper: draw all edges into current path
  function pathEdges() {
    for (let i = 0; i < edges.length; i += 2) {
      const a = edges[i], b = edges[i + 1]
      ctx.moveTo(sx[a], sy[a])
      ctx.lineTo(sx[b], sy[b])
    }
  }

  ctx.lineCap = 'round'

  // — Glow pass —
  if (glow > 0) {
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = palette.glowColor
    ctx.lineWidth = glowW
    ctx.shadowBlur = blur
    ctx.shadowColor = palette.glowColor
    ctx.beginPath()
    pathEdges()
    ctx.stroke()
    ctx.restore()
  }

  // — Crisp edge pass —
  ctx.globalAlpha = 0.8
  ctx.strokeStyle = palette.edgePrimary
  ctx.lineWidth = edgeW
  ctx.shadowBlur = 0
  ctx.beginPath()
  pathEdges()
  ctx.stroke()

  // — Nodes —
  ctx.globalAlpha = 1
  ctx.fillStyle = palette.nodeColor
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    ctx.moveTo(sx[i] + nodeR, sy[i])
    ctx.arc(sx[i], sy[i], nodeR, 0, Math.PI * 2)
  }
  ctx.fill()

  if (showStats) {
    const edgeCount = edges.length >> 1
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#94a3b8'
    const fs = Math.max(10, Math.round(minDim * 0.016))
    ctx.font = `${fs}px system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`${n} pts · ${edgeCount} edges`, W - 10, H - 8)
    ctx.restore()
  }
}
