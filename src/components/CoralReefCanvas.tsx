/**
 * CoralReefCanvas.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT: 3D forward-perspective "Living Reef" hero for the Dashboard.
 *
 * VIEW: Camera looks forward into a single coral reef formation. The reef
 *       sits at mid-depth. Open water fills the upper third. The ocean floor
 *       recedes from the bottom edge toward the horizon.
 *
 * 3D SYSTEM: Simplified depth-based projection (not ray-marching).
 *   depth 0 = near (large, low on screen)   depth 1 = far (small, near horizon)
 *   project(wx, wy, depth) → (sx, sy, scale)
 *   wx = world x from center, wy = height above floor, depth = 0-1
 *
 * LAYERS (back → front):
 *   1. Ocean water gradient (upper zone)
 *   2. Animated light rays from surface
 *   3. Ocean floor (perspective trapezoid + depth grid lines)
 *   4. Reef base mound (limestone substrate)
 *   5. Brain corals
 *   6. Sea fans
 *   7. Staghorn corals (depth-sorted back→front, painter's algorithm)
 *   8. Fish (count scales with health)
 *   9. Bubbles (rising particles)
 *  10. Edge vignette
 *  11. Title overlay (HTML, top-left)
 *  12. Year scrubber (HTML, bottom)
 *
 * CONTROL: Year is React state, defaults to 2024 (today).
 *          User drags the scrubber to explore 2000–2024.
 *          Health is derived from year; NO auto-advance.
 *
 * PERFORMANCE:
 *   - Geometry pre-generated once per mount/resize in generateScene().
 *   - RAF loop reads refs only — zero React state mutations per frame.
 *   - Sway derived from sin(t) — no mutable geometry.
 *   - ResizeObserver on parent for responsive DPR-scaled canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react'

interface CoralReefCanvasProps {
  title?: string
  subtitle?: string
  variant?: 'full' | 'card'
  titleLevel?: 1 | 2 | 3
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2

/** Horizon sits 32% from the top of the canvas. */
const HORIZON_FRAC = 0.32

/** Healthy coral colors (bleaches toward bone white as health drops) */
const HEALTHY_COLORS = ['#ff6b9e', '#ff8c42', '#00c9a7', '#9b59b6'] as const
const BLEACH_LIGHT = '#f5f0e8'
const BLEACH_BONE  = '#e8e0d4'

// ─── Health timeline ──────────────────────────────────────────────────────────

interface HealthPoint { year: number; health: number; event?: string }

const TIMELINE: HealthPoint[] = [
  { year: 2000, health: 78 },
  { year: 2002, health: 62, event: 'Widespread Bleaching — Indian Ocean & Pacific' },
  { year: 2003, health: 68 },
  { year: 2010, health: 58, event: 'Global Bleaching Event' },
  { year: 2012, health: 64 },
  { year: 2016, health: 38, event: 'Mass Bleaching — 50% of Great Barrier Reef' },
  { year: 2017, health: 44 },
  { year: 2020, health: 41, event: 'Global Bleaching Continues' },
  { year: 2022, health: 50 },
  { year: 2024, health: 34, event: 'Record Ocean Temperatures' },
]

const FIRST_YEAR = TIMELINE[0].year
const LAST_YEAR  = TIMELINE[TIMELINE.length - 1].year
const YEAR_SPAN  = LAST_YEAR - FIRST_YEAR

const EVENT_YEARS = TIMELINE.filter(p => p.event)

function healthAtYear(year: number): number {
  const y = Math.max(FIRST_YEAR, Math.min(LAST_YEAR, year))
  let lo = TIMELINE[0]
  let hi = TIMELINE[TIMELINE.length - 1]
  for (let i = 0; i < TIMELINE.length - 1; i++) {
    if (y >= TIMELINE[i].year && y <= TIMELINE[i + 1].year) {
      lo = TIMELINE[i]; hi = TIMELINE[i + 1]; break
    }
  }
  const segLen = hi.year - lo.year
  const t = segLen === 0 ? 0 : (y - lo.year) / segLen
  const te = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  return lo.health + (hi.health - lo.health) * te
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const tc = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  return `rgb(${Math.round(r1 + (r2 - r1) * tc)},${Math.round(g1 + (g2 - g1) * tc)},${Math.round(b1 + (b2 - b1) * tc)})`
}

function coralColor(colorIndex: number, health: number): string {
  const t = Math.max(0, Math.min(1, (100 - health) / 100)) * 1.35
  const target = health < 28 ? BLEACH_BONE : BLEACH_LIGHT
  return lerpColor(HEALTHY_COLORS[colorIndex % 4], target, t)
}

// ─── 3D Projection ────────────────────────────────────────────────────────────
//
// This is an artistic (non-physically-accurate) projection designed to look
// natural for a forward-looking underwater reef view.
//
// wx = world X offset from center (positive = right)
// wy = height above ocean floor (positive = up)
// depth = 0 (near, large) → 1 (far, tiny, near horizon)

function project(wx: number, wy: number, depth: number, w: number, h: number) {
  const horizonY = h * HORIZON_FRAC
  const scale = Math.max(0.04, 1 - depth * 0.82)
  const floorY = horizonY + (h - horizonY) * (1 - depth)
  return { sx: w / 2 + wx * scale, sy: floorY - wy * scale, scale, floorY }
}

// ─── Scene types ──────────────────────────────────────────────────────────────

interface CoralBranch {
  // Local-space coordinates (lx = horizontal from base, ly = height above floor)
  lx1: number; ly1: number
  lx2: number; ly2: number
  thickness: number
  treeDepth: number  // recursion depth (0 = tip)
}

interface Coral3D {
  kind: 'staghorn' | 'seafan'
  wx: number       // world x (scene center = 0)
  depth: number    // 0-1
  branches: CoralBranch[]
  maxLocalHeight: number
  swayAmp: number  // world x units, applied before projection
  swayPhase: number
  colorIndex: number
}

interface BrainCoral3D {
  wx: number
  depth: number
  rx: number  // local-space x-radius
  ry: number  // local-space y-radius (also = center height above floor)
  colorIndex: number
  swayAmp: number
  swayPhase: number
  /** Pre-computed groove polylines in local (lx, ly) coords */
  grooves: { lx: number; ly: number }[][]
}

interface Fish3D {
  startWX: number
  wy: number      // world height (stays fixed per fish)
  depth: number
  speed: number   // world x per second
  dir: 1 | -1
  bodyLen: number // local units
  bodyH: number
  yWobbleAmp: number
  yWobblePhase: number
  yWobbleFreq: number
  colorIndex: number
}

interface Bubble {
  startWX: number
  depth: number
  startYFrac: number  // initial Y as fraction of canvas height [0,1]
  r: number           // screen-pixel radius (not depth-scaled, stays small)
  speed: number       // screen px per second (upward)
  drift: number
  driftPhase: number
  driftFreq: number
  opacity: number
}

interface LightRay {
  xFrac: number
  angle: number
  topWidth: number
  length: number
  baseOpacity: number
  phase: number
}

interface Scene {
  corals: Coral3D[]       // sorted back→front (painter's algorithm)
  brainCorals: BrainCoral3D[]
  fish: Fish3D[]
  bubbles: Bubble[]
  rays: LightRay[]
  w: number
  h: number
}

// ─── Geometry generation ──────────────────────────────────────────────────────

/** Recursively build branch segments in LOCAL (lx, ly) space. */
function buildBranches(
  lx: number, ly: number,
  angleDeg: number, len: number,
  thickness: number, depth: number,
  spreadDeg: number,
  result: CoralBranch[]
): void {
  if (depth < 0 || len < 1.5) return
  const rad = (angleDeg * Math.PI) / 180
  const lx2 = lx + Math.sin(rad) * len
  const ly2 = ly + Math.cos(rad) * len  // ly increases upward
  result.push({ lx1: lx, ly1: ly, lx2, ly2, thickness, treeDepth: depth })
  const jitter = (Math.random() - 0.5) * 12
  buildBranches(lx2, ly2, angleDeg - spreadDeg + jitter, len * 0.68, thickness * 0.72, depth - 1, spreadDeg, result)
  buildBranches(lx2, ly2, angleDeg + spreadDeg + jitter, len * 0.68, thickness * 0.72, depth - 1, spreadDeg, result)
}

/** Generate the complete 3D scene. Called once per mount and on resize. */
function generateScene(w: number, h: number): Scene {
  // ── Define the reef layout ─────────────────────────────────────────────
  // Each entry places a coral at (wx, depth) with a height multiplier.
  // The reef forms a natural mound: tallest corals in the center/mid-ground,
  // smaller ones on the flanks and background.
  const reefLayout: { wx: number; depth: number; heightMult: number; kind: 'staghorn' | 'seafan'; spread: number }[] = [
    // ── Core reef (central mound, mid-depth) ──
    { wx: -20,  depth: 0.46, heightMult: 1.05, kind: 'staghorn', spread: 28 },
    { wx:  35,  depth: 0.50, heightMult: 1.10, kind: 'staghorn', spread: 26 },
    { wx:  85,  depth: 0.44, heightMult: 0.90, kind: 'staghorn', spread: 30 },
    { wx: -90,  depth: 0.48, heightMult: 0.95, kind: 'staghorn', spread: 28 },
    { wx:  10,  depth: 0.56, heightMult: 0.80, kind: 'seafan',   spread: 16 },
    { wx: -50,  depth: 0.58, heightMult: 0.75, kind: 'seafan',   spread: 18 },
    // ── Mid flanks ──
    { wx:  170, depth: 0.40, heightMult: 0.80, kind: 'staghorn', spread: 24 },
    { wx: -175, depth: 0.43, heightMult: 0.75, kind: 'staghorn', spread: 26 },
    { wx:  110, depth: 0.55, heightMult: 0.70, kind: 'seafan',   spread: 15 },
    { wx: -115, depth: 0.52, heightMult: 0.72, kind: 'staghorn', spread: 27 },
    // ── Background ──
    { wx:   20, depth: 0.72, heightMult: 0.50, kind: 'staghorn', spread: 22 },
    { wx: -110, depth: 0.75, heightMult: 0.45, kind: 'seafan',   spread: 14 },
    { wx:  140, depth: 0.70, heightMult: 0.48, kind: 'staghorn', spread: 24 },
    { wx:   60, depth: 0.80, heightMult: 0.35, kind: 'seafan',   spread: 13 },
    // ── Foreground accents (large, near edges of frame) ──
    { wx: -370, depth: 0.20, heightMult: 1.20, kind: 'staghorn', spread: 30 },
    { wx:  340, depth: 0.22, heightMult: 1.10, kind: 'staghorn', spread: 28 },
    { wx: -260, depth: 0.30, heightMult: 0.90, kind: 'seafan',   spread: 18 },
    { wx:  250, depth: 0.28, heightMult: 0.85, kind: 'staghorn', spread: 26 },
  ]

  const corals: Coral3D[] = reefLayout.map((pos, i) => {
    const scale = 1 - pos.depth * 0.82
    const trunkLen = (55 + Math.random() * 25) * pos.heightMult
    const thickness = (2.2 + Math.random() * 1.8) * scale
    const maxDepth = pos.depth < 0.5 ? 5 : 4

    const branches: CoralBranch[] = []
    const lean = (Math.random() - 0.5) * 18
    buildBranches(0, 0, lean, trunkLen, thickness, maxDepth, pos.spread + Math.random() * 6, branches)

    const maxLocalHeight = branches.reduce((m, b) => Math.max(m, b.ly2), 0)

    return {
      kind: pos.kind,
      wx: pos.wx + (Math.random() - 0.5) * 25,
      depth: pos.depth + (Math.random() - 0.5) * 0.03,
      branches,
      maxLocalHeight,
      swayAmp: (3 + Math.random() * 4.5) * (1 - pos.depth * 0.55),
      swayPhase: Math.random() * TAU,
      colorIndex: i % 4,
    }
  })

  // Depth-sort back→front for painter's algorithm
  corals.sort((a, b) => b.depth - a.depth)

  // ── Brain corals (3 scattered on the floor) ───────────────────────────
  const brainPositions = [
    { wx: -200, depth: 0.38 },
    { wx:  155, depth: 0.60 },
    { wx:  -60, depth: 0.65 },
  ]
  const brainCorals: BrainCoral3D[] = brainPositions.map((pos, i) => {
    const rx = 28 + Math.random() * 20
    const ry = 18 + Math.random() * 12
    // Pre-compute groove paths in local (lx, ly) space
    const grooves: { lx: number; ly: number }[][] = []
    const grooveCount = 9
    for (let gi = 0; gi < grooveCount; gi++) {
      const yFrac = (gi + 0.5) / grooveCount
      // dome: y = ry - ry*yFrac → local_ly = ry*(1 - yFrac)
      const localLy = ry * (1 - yFrac)
      const halfW = rx * Math.sqrt(Math.max(0, 1 - yFrac * yFrac))
      const pts: { lx: number; ly: number }[] = []
      for (let si = 0; si <= 24; si++) {
        const tl = si / 24
        const glx = -halfW + tl * 2 * halfW
        const gly = localLy + Math.sin(tl * Math.PI * 5 + gi * 1.1) * 2.5
        pts.push({ lx: glx, ly: gly })
      }
      grooves.push(pts)
    }
    return {
      wx: pos.wx + (Math.random() - 0.5) * 30,
      depth: pos.depth + (Math.random() - 0.5) * 0.04,
      rx, ry, grooves,
      colorIndex: (i + 2) % 4,
      swayAmp: 1 + Math.random() * 1.5,
      swayPhase: Math.random() * TAU,
    }
  })

  // ── Fish ──────────────────────────────────────────────────────────────
  const fish: Fish3D[] = Array.from({ length: 14 }, (_, i) => ({
    startWX: (Math.random() - 0.5) * 1200,
    wy: 35 + Math.random() * 200,
    depth: 0.08 + Math.random() * 0.70,
    speed: 55 + Math.random() * 110,
    dir: (Math.random() < 0.5 ? 1 : -1) as 1 | -1,
    bodyLen: 13 + Math.random() * 13,
    bodyH:    7 + Math.random() * 5,
    yWobbleAmp:   5 + Math.random() * 10,
    yWobblePhase: Math.random() * TAU,
    yWobbleFreq:  0.35 + Math.random() * 0.55,
    colorIndex: i % 4,
  }))

  // ── Bubbles ───────────────────────────────────────────────────────────
  const bubbles: Bubble[] = Array.from({ length: 42 }, () => ({
    startWX:    (Math.random() - 0.5) * 800,
    depth:       0.05 + Math.random() * 0.80,
    startYFrac:  Math.random(),
    r:           1 + Math.random() * 2.5,
    speed:       14 + Math.random() * 24,
    drift:        5 + Math.random() * 12,
    driftPhase:  Math.random() * TAU,
    driftFreq:   0.25 + Math.random() * 0.45,
    opacity:     0.1 + Math.random() * 0.28,
  }))

  // ── Light rays ────────────────────────────────────────────────────────
  const rays: LightRay[] = Array.from({ length: 7 }, (_, i) => ({
    xFrac:       0.05 + (i / 6) * 0.90,
    angle:       (Math.random() - 0.5) * 0.22,
    topWidth:    32 + Math.random() * 52,
    length:      190 + Math.random() * 170,
    baseOpacity: 0.022 + Math.random() * 0.042,
    phase:       Math.random() * TAU,
  }))

  return { corals, brainCorals, fish, bubbles, rays, w, h }
}

// ─── Sway helper ──────────────────────────────────────────────────────────────

/** Returns world-x sway offset at a given local height (ly). */
function swayAtHeight(amp: number, phase: number, t: number, ly: number, maxH: number): number {
  if (maxH <= 0) return 0
  const offset = amp * (
    0.7 * Math.sin(t * 0.4 * TAU + phase) +
    0.3 * Math.sin(t * 0.7 * TAU + phase * 1.3)
  )
  return offset * Math.min(1, ly / maxH)
}

// ─── Draw functions ───────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, health: number): void {
  const horizonY = h * HORIZON_FRAC
  const warmT = Math.max(0, (62 - health) / 62) * 0.4

  // Upper water column
  const waterGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
  waterGrad.addColorStop(0, '#040c16')
  waterGrad.addColorStop(0.6, lerpColor('#0c2033', '#131008', warmT))
  waterGrad.addColorStop(1, '#0d2540')
  ctx.fillStyle = waterGrad
  ctx.fillRect(0, 0, w, horizonY)

  // Ocean floor zone
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h)
  floorGrad.addColorStop(0, '#0d2420')
  floorGrad.addColorStop(1, lerpColor('#1e3e2a', '#221e0e', warmT * 0.6))
  ctx.fillStyle = floorGrad
  ctx.fillRect(0, horizonY, w, h - horizonY)

  // Perspective depth-grid lines on floor (converge to vanishing point)
  ctx.save()
  ctx.strokeStyle = 'rgba(0,70,50,0.10)'
  ctx.lineWidth = 1
  const vx = w / 2
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath()
    ctx.moveTo(vx, horizonY)
    ctx.lineTo(vx + i * w * 0.22, h)
    ctx.stroke()
  }
  // Horizontal depth bands
  ctx.globalAlpha = 0.07
  for (let d = 0.15; d < 1; d += 0.18) {
    const bandY = horizonY + (h - horizonY) * (1 - d)
    ctx.beginPath()
    ctx.moveTo(0, bandY); ctx.lineTo(w, bandY)
    ctx.stroke()
  }
  ctx.restore()
}

function drawLightRays(ctx: CanvasRenderingContext2D, scene: Scene, t: number, health: number): void {
  const intensity = 0.25 + 0.75 * (health / 100)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (const ray of scene.rays) {
    const op = ray.baseOpacity * intensity * (0.55 + 0.45 * Math.sin(t * 0.75 + ray.phase))
    const tx = ray.xFrac * scene.w
    const bx = tx + Math.sin(ray.angle) * ray.length
    const tHalf = ray.topWidth / 2
    const bHalf = ray.topWidth * 0.10
    const grad = ctx.createLinearGradient(tx, 0, bx, ray.length)
    grad.addColorStop(0, `rgba(190,225,255,${op})`)
    grad.addColorStop(1, 'rgba(190,225,255,0)')
    ctx.beginPath()
    ctx.moveTo(tx - tHalf, 0)
    ctx.lineTo(tx + tHalf, 0)
    ctx.lineTo(bx + bHalf, ray.length)
    ctx.lineTo(bx - bHalf, ray.length)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }
  ctx.restore()
}

function drawReefBase(ctx: CanvasRenderingContext2D, w: number, h: number, health: number): void {
  // Draw the limestone reef substrate — a dark mound at mid-depth
  const { sx, floorY, scale } = project(0, 0, 0.52, w, h)
  const moundW = 340 * scale
  const moundH = 65 * scale
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(sx, floorY + moundH * 0.25, moundW, moundH, 0, Math.PI, 0, true)
  ctx.fillStyle = lerpColor('#152a1e', '#201808', (100 - health) / 100 * 0.45)
  ctx.fill()
  ctx.restore()
}

function drawBrainCoral(ctx: CanvasRenderingContext2D, bc: BrainCoral3D, t: number, health: number, w: number, h: number): void {
  const sway = swayAtHeight(bc.swayAmp, bc.swayPhase, t, bc.ry, bc.ry) * 0.5
  const { floorY, scale } = project(bc.wx, 0, bc.depth, w, h)
  const centerX = w / 2 + bc.wx * scale + sway * scale
  const centerY = floorY - bc.ry * scale
  const scrx = bc.rx * scale
  const scry = bc.ry * scale
  const color = coralColor(bc.colorIndex, health)
  // Fog: bleached corals stay lighter; only darken by depth, not toward black
  const fogTarget = '#0a2030'
  const fogT = bc.depth * 0.28
  const fColor = lerpColor(color, fogTarget, fogT)
  const alpha = Math.max(0.40, 1 - bc.depth * 0.50)

  ctx.save()
  ctx.globalAlpha = alpha

  // Dome fill — always show a glow (dim at low health)
  const glowIntensity = health > 55 ? 10 : health > 30 ? 3 : 0
  ctx.beginPath()
  ctx.ellipse(centerX, centerY, scrx, scry, 0, Math.PI, 0, true)
  ctx.fillStyle = fColor
  ctx.shadowColor = color  // unfogged for glow
  ctx.shadowBlur = glowIntensity * scale
  ctx.fill()

  // Dome rim
  ctx.shadowBlur = 0
  ctx.strokeStyle = lerpColor(fColor, '#050e18', 0.35)
  ctx.lineWidth = 1.2 * scale
  ctx.stroke()

  // Grooves
  ctx.strokeStyle = lerpColor(fColor, '#050e18', 0.45)
  ctx.lineWidth = 0.7 * scale
  for (const groove of bc.grooves) {
    ctx.beginPath()
    const p0 = project(bc.wx + groove[0].lx + sway, groove[0].ly, bc.depth, w, h)
    ctx.moveTo(p0.sx, p0.sy)
    for (let i = 1; i < groove.length; i++) {
      const p = project(bc.wx + groove[i].lx + sway, groove[i].ly, bc.depth, w, h)
      ctx.lineTo(p.sx, p.sy)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawCoral(ctx: CanvasRenderingContext2D, coral: Coral3D, t: number, health: number, w: number, h: number): void {
  const color = coralColor(coral.colorIndex, health)
  // Fog: use blue-tinted ocean color so vibrant hues aren't killed toward black
  const fogTarget = '#0a2030'
  const fogT = coral.depth * 0.28
  const fColor = lerpColor(color, fogTarget, fogT)
  const alpha = Math.max(0.35, 1 - coral.depth * 0.52)

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = fColor
  ctx.lineCap = 'round'

  const { scale } = project(coral.wx, 0, coral.depth, w, h)
  // Glow: vivid at high health, dims as bleaching sets in
  const glowBlur = health > 55
    ? (14 - (100 - health) * 0.12) * scale
    : health > 30 ? 3 * scale : 0
  ctx.shadowColor = color   // use unfogged color for glow
  ctx.shadowBlur = glowBlur

  if (coral.kind === 'seafan') ctx.globalAlpha = alpha * 0.88

  for (const branch of coral.branches) {
    const sway1 = swayAtHeight(coral.swayAmp, coral.swayPhase, t, branch.ly1, coral.maxLocalHeight)
    const sway2 = swayAtHeight(coral.swayAmp, coral.swayPhase, t, branch.ly2, coral.maxLocalHeight)
    const p1 = project(coral.wx + branch.lx1 + sway1, branch.ly1, coral.depth, w, h)
    const p2 = project(coral.wx + branch.lx2 + sway2, branch.ly2, coral.depth, w, h)

    ctx.beginPath()
    ctx.lineWidth = branch.thickness * scale
    ctx.moveTo(p1.sx, p1.sy)
    ctx.lineTo(p2.sx, p2.sy)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFish(ctx: CanvasRenderingContext2D, scene: Scene, t: number, health: number): void {
  const visibleCount = Math.max(2, Math.ceil(scene.fish.length * health / 100))

  ctx.save()
  for (let i = 0; i < visibleCount; i++) {
    const f = scene.fish[i]
    const { scale, floorY } = project(0, f.wy, f.depth, scene.w, scene.h)

    const worldXRange = 1400
    const traveled = (t * f.speed) % worldXRange
    const rawWX = ((f.startWX + f.dir * traveled) % worldXRange + worldXRange) % worldXRange - worldXRange / 2

    const drawX = scene.w / 2 + rawWX * scale
    const drawY = floorY - f.wy * scale + f.yWobbleAmp * Math.sin(t * f.yWobbleFreq + f.yWobblePhase) * scale

    const bl = f.bodyLen * scale
    const bh = f.bodyH * scale

    if (drawX < -bl - 10 || drawX > scene.w + bl + 10) continue

    const fishColor = lerpColor(HEALTHY_COLORS[f.colorIndex % 4], '#a0bcb8', Math.max(0, (100 - health) / 100) * 0.78)
    const fColor = lerpColor(fishColor, '#07172a', f.depth * 0.48)
    const alpha = Math.max(0.25, 1 - f.depth * 0.65)

    ctx.globalAlpha = alpha
    ctx.save()
    ctx.translate(drawX, drawY)
    if (f.dir === -1) ctx.scale(-1, 1)

    ctx.beginPath()
    ctx.ellipse(0, 0, bl / 2, bh / 2, 0, 0, TAU)
    ctx.fillStyle = fColor
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-bl / 2, 0)
    ctx.lineTo(-bl / 2 - bh * 0.9, -bh / 2)
    ctx.lineTo(-bl / 2 - bh * 0.9,  bh / 2)
    ctx.closePath()
    ctx.fillStyle = fColor
    ctx.fill()

    ctx.beginPath()
    ctx.arc(bl / 4, -bh / 6, Math.max(0.5, 1.4 * scale), 0, TAU)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.fill()

    ctx.restore()
  }
  ctx.restore()
}

function drawBubbles(ctx: CanvasRenderingContext2D, scene: Scene, t: number, health: number): void {
  const horizonY = scene.h * HORIZON_FRAC
  const visibleCount = Math.max(6, Math.ceil(scene.bubbles.length * health / 100))

  ctx.save()
  for (let i = 0; i < visibleCount; i++) {
    const b = scene.bubbles[i]
    const { sx } = project(b.startWX, 0, b.depth, scene.w, scene.h)
    const totalRange = scene.h + 40
    const risen = (t * b.speed) % totalRange
    const drawY = ((b.startYFrac * scene.h - risen + totalRange) % totalRange)
    if (drawY < horizonY * 0.4) continue

    const driftX = b.drift * Math.sin(t * b.driftFreq + b.driftPhase)
    ctx.globalAlpha = b.opacity * Math.max(0.3, 1 - b.depth * 0.6)
    ctx.strokeStyle = 'rgba(170,215,255,1)'
    ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.arc(sx + driftX, drawY, b.r, 0, TAU)
    ctx.stroke()
  }
  ctx.restore()
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.80)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ─── Master draw ──────────────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number,
  health: number
): void {
  const { w, h } = scene
  ctx.clearRect(0, 0, w, h)
  drawBackground(ctx, w, h, health)
  drawLightRays(ctx, scene, t, health)
  drawReefBase(ctx, w, h, health)
  // Brain corals (sort with main corals is hard; draw before staghorns at similar depth)
  scene.brainCorals.forEach(bc => drawBrainCoral(ctx, bc, t, health, w, h))
  // Corals are pre-sorted back→front
  scene.corals.forEach(c => drawCoral(ctx, c, t, health, w, h))
  drawBubbles(ctx, scene, t, health)
  drawFish(ctx, scene, t, health)
  drawVignette(ctx, w, h)
}

// ─── React component ──────────────────────────────────────────────────────────

export default function CoralReefCanvas({
  title = 'Research Program Dashboard',
  subtitle = 'Indonesia Coral Reef Financing Research',
  variant = 'full',
  titleLevel = 1,
}: CoralReefCanvasProps) {
  const [selectedYear, setSelectedYear] = useState(LAST_YEAR)
  const yearRef = useRef(LAST_YEAR)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<Scene | null>(null)
  const rafRef    = useRef<number>(0)
  const startRef  = useRef<number>(0)
  const dprRef    = useRef<number>(1)

  // Mirror selectedYear into a ref for the RAF loop (avoids stale closure)
  useEffect(() => {
    yearRef.current = selectedYear
  }, [selectedYear])

  useEffect(() => {
    const maybeCanvas = canvasRef.current
    if (!maybeCanvas) return
    const canvas: HTMLCanvasElement = maybeCanvas

    function resize() {
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr
      const containerW = canvas.parentElement?.clientWidth ?? 900
      canvas.width  = containerW * dpr
      canvas.height = 600 * dpr
      canvas.style.width  = containerW + 'px'
      canvas.style.height = '600px'
      sceneRef.current = generateScene(canvas.width, canvas.height)
    }

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick)
      const ctx = canvas.getContext('2d')
      if (!ctx || !sceneRef.current) return
      const t = (now - startRef.current) / 1000
      const health = healthAtYear(yearRef.current)
      drawFrame(ctx, sceneRef.current, t, health)
    }

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    resize()

    startRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  const activeEvent = TIMELINE.find(p => p.year === selectedYear)?.event ?? null
  const TitleTag = (titleLevel === 1 ? 'h1' : titleLevel === 2 ? 'h2' : 'h3') as 'h1' | 'h2' | 'h3'

  return (
    <section
      className={`coral-reef-hero${variant === 'card' ? ' coral-reef-hero--card' : ''}`}
      aria-label="Coral reef health viewer"
    >

      <canvas ref={canvasRef} className="coral-reef-canvas" aria-hidden />

      {/* Title — floats top-left */}
      {(title || subtitle) && (
        <div className="crc-title-overlay">
          {title && <TitleTag className="crc-title-text">{title}</TitleTag>}
          {subtitle && <p className="crc-subtitle-text">{subtitle}</p>}
        </div>
      )}

      {/* Year scrubber — floats bottom */}
      <div className="crc-scrubber">
        <div className="crc-scrubber-top">
          <span className="crc-year">{selectedYear}</span>
          {activeEvent
            ? <span className="crc-event">{activeEvent}</span>
            : <span className="crc-event crc-event--empty">Drag to explore reef health history</span>
          }
        </div>

        <div className="crc-slider-wrap">
          <input
            type="range"
            className="crc-slider"
            min={FIRST_YEAR}
            max={LAST_YEAR}
            step={1}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            aria-label="Select year to view coral health"
          />
          {/* Tick marks at event years */}
          <div className="crc-ticks" aria-hidden>
            {EVENT_YEARS.map(p => (
              <span
                key={p.year}
                className={`crc-tick${p.year === selectedYear ? ' crc-tick--active' : ''}`}
                style={{ left: `${(p.year - FIRST_YEAR) / YEAR_SPAN * 100}%` }}
                title={p.event}
              />
            ))}
          </div>
        </div>

        <div className="crc-range-ends">
          <span>{FIRST_YEAR}</span>
          <span>Today</span>
        </div>
      </div>

      <span className="coral-reef-hero__sr-text">
        Interactive visualization of coral reef health from {FIRST_YEAR} to {LAST_YEAR}.
        Use the slider to explore different years.
      </span>
    </section>
  )
}
