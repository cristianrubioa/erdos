import type { WorkerInput, WorkerOutput, RingName, ThemeName } from './worker/types'
import { getTheme } from './renderer/themes'
import { render } from './renderer/canvas-renderer'
import { exportPNG } from './ui/export'

// ── localStorage helpers ───────────────────────────────────────────────────
function safeGet(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

// ── Per-ring defaults ──────────────────────────────────────────────────────
const DEFAULTS = {
  gauss: { n: 10, scale: 2.0, glow: 8, angle: 0 },
  cm:    {        scale: 2.0, glow: 8, angle: 0 },
}

// ── State ──────────────────────────────────────────────────────────────────
let currentRing: RingName = 'gauss'
let currentN = DEFAULTS.gauss.n
let currentScale = DEFAULTS.gauss.scale
let currentGlow = DEFAULTS.gauss.glow
let currentAngle = DEFAULTS.gauss.angle
let currentTheme: ThemeName = 'cosmic'
let customColor = '#00ffcc'
let lastPoints: Float32Array<ArrayBuffer> = new Float32Array(new ArrayBuffer(0))
let lastEdges: Uint32Array<ArrayBuffer> = new Uint32Array(new ArrayBuffer(0))

// ── Worker ─────────────────────────────────────────────────────────────────
let worker: Worker | null = null
const computingEl = document.getElementById('computing')!
let computingTimer: ReturnType<typeof setTimeout> | null = null

function setComputing(active: boolean) {
  if (active) {
    computingTimer = setTimeout(() => computingEl.classList.add('visible'), 120)
  } else {
    if (computingTimer) { clearTimeout(computingTimer); computingTimer = null }
    computingEl.classList.remove('visible')
  }
}

function spawnWorker() {
  const next = new Worker(new URL('./worker/ring-engine.ts', import.meta.url), { type: 'module' })
  next.onmessage = (e: MessageEvent<WorkerOutput>) => {
    setComputing(false)
    if (e.data.error) {
      console.error(e.data.error)
      alert('Failed to load CM dataset. Check console for details.')
      lastPoints = new Float32Array(new ArrayBuffer(0))
      lastEdges = new Uint32Array(new ArrayBuffer(0))
      scheduleRender()
      return
    }
    lastPoints = e.data.points
    lastEdges = e.data.edges
    scheduleRender()
  }
  return next
}

function dispatchWorker() {
  setComputing(true)
  if (worker) worker.terminate()
  worker = spawnWorker()
  const msg: WorkerInput = { ring: currentRing, n: currentN }
  worker.postMessage(msg)
}

let dispatchTimer: ReturnType<typeof setTimeout> | null = null
function dispatchWorkerDebounced() {
  if (dispatchTimer) clearTimeout(dispatchTimer)
  dispatchTimer = setTimeout(() => {
    dispatchTimer = null
    dispatchWorker()
  }, 150)
}

// ── Canvas ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('main-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let rafPending = false

function resizeCanvas() {
  const wrap = canvas.parentElement!
  canvas.width = wrap.clientWidth
  canvas.height = wrap.clientHeight
  scheduleRender()
}

function scheduleRender() {
  if (rafPending) return
  rafPending = true
  requestAnimationFrame(() => {
    rafPending = false
    const palette = getTheme(currentTheme, customColor)
    render(ctx, lastPoints, lastEdges, {
      palette,
      scale: currentScale,
      angleDeg: currentAngle,
      glow: currentGlow,
    })
  })
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()

// ── Accent CSS var ─────────────────────────────────────────────────────────
function applyAccent() {
  const palette = getTheme(currentTheme, customColor)
  document.documentElement.style.setProperty('--accent', palette.accentColor)
}

// ── Slider element refs ────────────────────────────────────────────────────
const nSlider    = document.getElementById('slider-n') as HTMLInputElement
const nVal       = document.getElementById('val-n')!
const paramsPanel = document.querySelector('.params')!
const scaleSlider = document.getElementById('slider-scale') as HTMLInputElement
const scaleVal    = document.getElementById('val-scale')!
const glowSlider  = document.getElementById('slider-glow') as HTMLInputElement
const glowVal     = document.getElementById('val-glow')!
const angleSlider = document.getElementById('slider-angle') as HTMLInputElement
const angleVal    = document.getElementById('val-angle')!

// ── Per-ring settings ──────────────────────────────────────────────────────
function loadRingSettings(ring: RingName) {
  if (ring === 'gauss') {
    currentN     = Number(safeGet('erdos-gauss-n',     String(DEFAULTS.gauss.n)))
    currentScale = Number(safeGet('erdos-gauss-scale', String(DEFAULTS.gauss.scale)))
    currentGlow  = Number(safeGet('erdos-gauss-glow',  String(DEFAULTS.gauss.glow)))
    currentAngle = Number(safeGet('erdos-gauss-angle', String(DEFAULTS.gauss.angle)))
    nSlider.value  = String(currentN);     nVal.textContent  = String(currentN)
  } else {
    currentScale = Number(safeGet('erdos-cm-scale', String(DEFAULTS.cm.scale)))
    currentGlow  = Number(safeGet('erdos-cm-glow',  String(DEFAULTS.cm.glow)))
    currentAngle = Number(safeGet('erdos-cm-angle', String(DEFAULTS.cm.angle)))
  }
  scaleSlider.value = String(currentScale); scaleVal.textContent = currentScale.toFixed(1)
  glowSlider.value  = String(currentGlow);  glowVal.textContent  = String(currentGlow)
  angleSlider.value = String(currentAngle); angleVal.textContent = currentAngle + '°'
}

// ── Disclaimer elements ────────────────────────────────────────────────────
const disclaimerGauss = document.getElementById('disclaimer-gauss')!
const disclaimerCm    = document.getElementById('disclaimer-cm')!

function updateDisclaimer(ring: RingName) {
  if (ring === 'gauss') {
    disclaimerGauss.classList.remove('hidden')
    disclaimerCm.classList.add('hidden')
  } else {
    disclaimerGauss.classList.add('hidden')
    disclaimerCm.classList.remove('hidden')
  }
}

// ── Ring selector ──────────────────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.ring-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ring-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentRing = btn.dataset.ring as RingName
    safeSet('erdos-ring', currentRing)
    paramsPanel.classList.toggle('cm-mode', currentRing === 'cm')
    loadRingSettings(currentRing)
    updateDisclaimer(currentRing)
    dispatchWorkerDebounced()
  })
})

// ── Sliders ────────────────────────────────────────────────────────────────
nSlider.addEventListener('input', () => {
  currentN = Number(nSlider.value)
  nVal.textContent = String(currentN)
  safeSet('erdos-gauss-n', String(currentN))
  dispatchWorkerDebounced()
})

scaleSlider.addEventListener('input', () => {
  currentScale = Number(scaleSlider.value)
  scaleVal.textContent = currentScale.toFixed(1)
  safeSet(`erdos-${currentRing}-scale`, String(currentScale))
  scheduleRender()
})

glowSlider.addEventListener('input', () => {
  currentGlow = Number(glowSlider.value)
  glowVal.textContent = String(currentGlow)
  safeSet(`erdos-${currentRing}-glow`, String(currentGlow))
  scheduleRender()
})

angleSlider.addEventListener('input', () => {
  currentAngle = Number(angleSlider.value)
  angleVal.textContent = currentAngle + '°'
  safeSet(`erdos-${currentRing}-angle`, String(currentAngle))
  scheduleRender()
})

// ── Theme swatches ─────────────────────────────────────────────────────────
document.querySelectorAll<HTMLDivElement>('.swatch').forEach(sw => {
  if (sw.dataset.theme === 'custom') return
  sw.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'))
    sw.classList.add('active')
    currentTheme = sw.dataset.theme as ThemeName
    applyAccent()
    scheduleRender()
  })
})

const customColorInput = document.getElementById('custom-color') as HTMLInputElement
customColorInput.addEventListener('input', () => {
  customColor = customColorInput.value
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'))
  document.querySelector('[data-theme="custom"]')!.classList.add('active')
  currentTheme = 'custom'
  applyAccent()
  scheduleRender()
})

// ── Export buttons ─────────────────────────────────────────────────────────
function makeExportConfig() {
  return {
    palette: getTheme(currentTheme, customColor),
    scale: currentScale,
    angleDeg: currentAngle,
    glow: currentGlow,
    ring: currentRing,
    theme: currentTheme,
  }
}

document.getElementById('btn-phone')!.addEventListener('click', () => {
  exportPNG(lastPoints, lastEdges, makeExportConfig(), 'phone')
})

document.getElementById('btn-desktop')!.addEventListener('click', () => {
  exportPNG(lastPoints, lastEdges, makeExportConfig(), 'desktop')
})

const cwInput = document.getElementById('cw') as HTMLInputElement
const chInput = document.getElementById('ch') as HTMLInputElement

cwInput.addEventListener('input', () => safeSet('erdos-export-w', cwInput.value))
chInput.addEventListener('input', () => safeSet('erdos-export-h', chInput.value))

document.getElementById('btn-custom-export')!.addEventListener('click', () => {
  const w = parseInt(cwInput.value)
  const h = parseInt(chInput.value)
  if (w < 100 || h < 100) { alert('Minimum size is 100 × 100'); return }
  exportPNG(lastPoints, lastEdges, makeExportConfig(), { w, h })
})

// ── Init ───────────────────────────────────────────────────────────────────
const savedRing = safeGet('erdos-ring', 'gauss') as RingName
currentRing = savedRing
document.querySelectorAll<HTMLButtonElement>('.ring-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.ring === currentRing)
})
paramsPanel.classList.toggle('cm-mode', currentRing === 'cm')

loadRingSettings(currentRing)
updateDisclaimer(currentRing)

cwInput.value = safeGet('erdos-export-w', '1920')
chInput.value = safeGet('erdos-export-h', '1080')

applyAccent()
dispatchWorker()

const pageLoader = document.getElementById('page-loader')!
pageLoader.classList.add('fade-out')
pageLoader.addEventListener('transitionend', () => pageLoader.remove(), { once: true })
