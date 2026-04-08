/**
 * CoralReefCanvas.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ARBORIST-inspired 3D coral bommie specimen viewer.
 *
 * A single coral bommie floats in a black void, slowly rotating on the Y axis.
 * 16 coral colonies grow from a central limestone hemisphere. Dragging the
 * year scrubber bleaches the corals from vivid bioluminescent color → bone white.
 *
 * 3D SYSTEM:
 *   - All branch geometry stored as Vec3 world-space coordinates.
 *   - Per frame: rotate by Y angle → perspective project → depth-sort → draw.
 *   - Painter's algorithm (back → front) for correct occlusion.
 *   - Glow via ctx.shadowBlur (full intensity when healthy, off when bleached).
 *
 * UI (HTML overlays, not canvas):
 *   - Top-left:  project header (monospace all-caps)
 *   - Top-right: live stats grid (year / health / colonies / segments)
 *   - Bottom:    year scrubber with event tick marks
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CoralReefCanvasProps {
  title?: string
  subtitle?: string
  variant?: string
  titleLevel?: number
}

// ─── Health timeline ──────────────────────────────────────────────────────────

interface HealthPoint { year: number; health: number; event?: string }

const TIMELINE: HealthPoint[] = [
  { year: 1950, health: 100 },
  { year: 1960, health: 97 },
  { year: 1968, health: 93, event: 'Crown-of-Thorns Starfish Outbreak — GBR' },
  { year: 1975, health: 88 },
  { year: 1980, health: 84 },
  { year: 1983, health: 80, event: 'El Niño Bleaching — First Recorded Mass Event' },
  { year: 1987, health: 77 },
  { year: 1990, health: 74 },
  { year: 1995, health: 68 },
  { year: 1998, health: 55, event: '1998 El Niño — First Global Bleaching Crisis' },
  { year: 1999, health: 63 },
  { year: 2000, health: 78 },
  { year: 2002, health: 62, event: 'Widespread Bleaching — Indian Ocean & Pacific' },
  { year: 2003, health: 67 },
  { year: 2010, health: 57, event: 'Global Bleaching Event' },
  { year: 2012, health: 63 },
  { year: 2016, health: 38, event: 'Mass Bleaching — 50% of Great Barrier Reef' },
  { year: 2017, health: 44 },
  { year: 2020, health: 41, event: 'Global Bleaching Continues' },
  { year: 2022, health: 49 },
  { year: 2024, health: 34, event: 'Record Ocean Temperatures' },
]
const FIRST_YEAR = 1950
const LAST_YEAR  = 2024
const YEAR_SPAN  = LAST_YEAR - FIRST_YEAR
const EVENT_YEARS = TIMELINE.filter(p => p.event)

function healthAtYear(year: number): number {
  const y = Math.max(FIRST_YEAR, Math.min(LAST_YEAR, year))
  let lo = TIMELINE[0], hi = TIMELINE[TIMELINE.length - 1]
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

// ─── Scene constants ──────────────────────────────────────────────────────────

const TAU         = Math.PI * 2
const BOMMIE_R    = 115   // hemisphere radius (world units)
const BRANCH_LEN  = 64    // initial trunk length per colony (world units)
const FOV         = 600   // perspective focal length
const ROT_PERIOD  = 32    // seconds per full Y revolution

const HEALTHY_COLORS = ['#ff6b9e', '#ff8c42', '#00c9a7', '#c77dff'] as const
const BLEACH_COLOR   = '#ddd8cc'

// ─── Vec3 math ────────────────────────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }

const v3 = {
  add:   (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  scale: (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
  dot:   (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  norm:  (v: Vec3): Vec3 => {
    const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    return l < 1e-6 ? { x: 0, y: 1, z: 0 } : { x: v.x / l, y: v.y / l, z: v.z / l }
  },
  rotY: (v: Vec3, a: number): Vec3 => {
    const c = Math.cos(a), s = Math.sin(a)
    return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c }
  },
  /** Rodrigues' rotation: rotate v around unit axis by angle radians */
  rotAround: (v: Vec3, axis: Vec3, angle: number): Vec3 => {
    const c = Math.cos(angle), s = Math.sin(angle)
    const d = v3.dot(v, axis)
    const cx = axis.y * v.z - axis.z * v.y
    const cy = axis.z * v.x - axis.x * v.z
    const cz = axis.x * v.y - axis.y * v.x
    return {
      x: v.x * c + cx * s + axis.x * d * (1 - c),
      y: v.y * c + cy * s + axis.y * d * (1 - c),
      z: v.z * c + cz * s + axis.z * d * (1 - c),
    }
  },
  /** Returns a random unit vector perpendicular to v */
  randPerp: (v: Vec3): Vec3 => {
    for (let i = 0; i < 12; i++) {
      const r = v3.norm({ x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 })
      const d = v3.dot(r, v)
      const p = v3.norm({ x: r.x - d * v.x, y: r.y - d * v.y, z: r.z - d * v.z })
      if (p.x * p.x + p.y * p.y + p.z * p.z > 0.05) return p
    }
    return { x: 1, y: 0, z: 0 }
  },
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}
function lerpColor(a: string, b: string, t: number): string {
  const tc = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return `rgb(${Math.round(r1 + (r2 - r1) * tc)},${Math.round(g1 + (g2 - g1) * tc)},${Math.round(b1 + (b2 - b1) * tc)})`
}
function coralColor(colorIndex: number, health: number): string {
  const t = Math.max(0, Math.min(1, (100 - health) / 50))
  return lerpColor(HEALTHY_COLORS[colorIndex % 4], BLEACH_COLOR, t)
}

// ─── Scene ────────────────────────────────────────────────────────────────────

type GroupStart = [number, number, number, number, number]
type ColorCache = [string, string, string, string]

interface Scene {
  // Geometry: [p1x, p1y, p1z, p2x, p2y, p2z, thickness, colorIndex] × N
  geom: Float32Array
  // Projected: [sx1, sy1, sx2, sy2, midZ] × N (kept in the same order as geom)
  proj: Float32Array
  // Pre-sorted by colorIndex: groupStart boundaries for 4 color groups
  groupStart: GroupStart

  // Fish params (orbit order): [rx, rz, y, phase, speed, bodyLen, bodyH, colorIndex] × 12
  fish: Float32Array
  fishCount: number

  // Cached (updates only when health changes)
  colorCache: ColorCache
  lastHealthKey: number

  // Background bloom cached by health (updates only when health changes)
  bloomCanvas: HTMLCanvasElement
  bloomCtx: CanvasRenderingContext2D
  lastBloomHealthKey: number

  frame: number
  w: number
  h: number
}

/**
 * Colony positions on the hemisphere:
 * phi  = polar angle from top (0° = apex, 90° = equator)
 * alpha = azimuthal angle around Y axis
 */
const COLONY_LAYOUT = [
  // Apex cluster: 2 colonies
  { phi:  18, alpha:  60 },
  { phi:  18, alpha: 240 },
  // Ring 2: 4 colonies
  { phi:  38, alpha:   0 },
  { phi:  38, alpha:  90 },
  { phi:  38, alpha: 180 },
  { phi:  38, alpha: 270 },
  // Ring 3: 5 colonies
  { phi:  60, alpha:  36 },
  { phi:  60, alpha: 108 },
  { phi:  60, alpha: 180 },
  { phi:  60, alpha: 252 },
  { phi:  60, alpha: 324 },
  // Base ring: 5 colonies
  { phi:  80, alpha:  18 },
  { phi:  80, alpha:  90 },
  { phi:  80, alpha: 162 },
  { phi:  80, alpha: 234 },
  { phi:  80, alpha: 306 },
]

function buildBranches3D(
  p1: Vec3, dir: Vec3, length: number, thickness: number,
  depth: number, spreadRad: number, colorIndex: number,
  result: number[][]
): void {
  if (depth < 0 || length < 0.5) return
  const p2 = v3.add(p1, v3.scale(dir, length))
  const out = result[colorIndex % 4]
  out.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, thickness)

  const spread = spreadRad * (0.82 + Math.random() * 0.36)
  const perp   = v3.randPerp(dir)
  const d1     = v3.norm(v3.rotAround(dir, perp,  spread))
  const d2     = v3.norm(v3.rotAround(dir, perp, -spread))
  // Twist around growth axis so branches spread in full 3D
  const twist  = (Math.random() - 0.5) * 1.4
  const dt1    = v3.norm(v3.rotAround(d1, dir,  twist))
  const dt2    = v3.norm(v3.rotAround(d2, dir, -twist))

  buildBranches3D(p2, dt1, length * 0.68, thickness * 0.72, depth - 1, spreadRad, colorIndex, result)
  buildBranches3D(p2, dt2, length * 0.68, thickness * 0.72, depth - 1, spreadRad, colorIndex, result)
}

function generateScene(w: number, h: number): Scene {
  const branchesByColor: number[][] = [[], [], [], []]
  const UP: Vec3 = { x: 0, y: 1, z: 0 }

  COLONY_LAYOUT.forEach(({ phi, alpha }, i) => {
    const phiR   = (phi   * Math.PI) / 180
    const alphaR = (alpha * Math.PI) / 180

    const origin: Vec3 = {
      x: BOMMIE_R * Math.sin(phiR) * Math.cos(alphaR),
      y: BOMMIE_R * Math.cos(phiR),
      z: BOMMIE_R * Math.sin(phiR) * Math.sin(alphaR),
    }
    const normal = v3.norm(origin)

    // Apex colonies grow mostly vertical; base colonies lean outward
    const blend  = phi < 45 ? 0.52 : 0.72
    const growDir = v3.norm({
      x: normal.x * blend + UP.x * (1 - blend),
      y: normal.y * blend + UP.y * (1 - blend),
      z: normal.z * blend + UP.z * (1 - blend),
    })

    const spreadRad = phi < 42
      ? (26 + Math.random() * 9)  * Math.PI / 180
      : (36 + Math.random() * 12) * Math.PI / 180

    buildBranches3D(
      origin, growDir, BRANCH_LEN,
      4.6 + Math.random() * 1.4,
      phi < 42 ? 5 : 4,
      spreadRad,
      i % 4,
      branchesByColor
    )
  })

  const group0 = branchesByColor[0].length / 7
  const group1 = branchesByColor[1].length / 7
  const group2 = branchesByColor[2].length / 7
  const group3 = branchesByColor[3].length / 7
  const total  = group0 + group1 + group2 + group3

  const geom = new Float32Array(total * 8)
  let writeIdx = 0
  for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
    const src = branchesByColor[colorIndex]
    for (let j = 0; j < src.length; j += 7) {
      geom[writeIdx + 0] = src[j + 0]
      geom[writeIdx + 1] = src[j + 1]
      geom[writeIdx + 2] = src[j + 2]
      geom[writeIdx + 3] = src[j + 3]
      geom[writeIdx + 4] = src[j + 4]
      geom[writeIdx + 5] = src[j + 5]
      geom[writeIdx + 6] = src[j + 6]
      geom[writeIdx + 7] = colorIndex
      writeIdx += 8
    }
  }

  const groupStart: GroupStart = [
    0,
    group0,
    group0 + group1,
    group0 + group1 + group2,
    total,
  ]

  // Fish: 12 on 3 orbital rings (inner/mid/outer), orbit order.
  const fishCount = 12
  const fish = new Float32Array(fishCount * 8)
  const ringR = [160, 220, 290]
  let fi = 0
  for (let ring = 0; ring < 3; ring++) {
    for (let k = 0; k < 4; k++) {
      const base = fi * 8
      const r = ringR[ring]
      const orbitRadiusX = r * (0.9 + Math.random() * 0.25)
      const orbitRadiusZ = r * (0.9 + Math.random() * 0.25)
      const orbitY = 18 + ring * 12 + Math.random() * 16
      const orbitPhase = Math.random() * TAU
      const orbitSpeed = 0.3 + Math.random() * 0.6
      const bodyLen = 18 + Math.random() * 10
      const bodyH = 6 + Math.random() * 4
      const colorIndex = Math.floor(Math.random() * 4)

      fish[base + 0] = orbitRadiusX
      fish[base + 1] = orbitRadiusZ
      fish[base + 2] = orbitY
      fish[base + 3] = orbitPhase
      fish[base + 4] = orbitSpeed
      fish[base + 5] = bodyLen
      fish[base + 6] = bodyH
      fish[base + 7] = colorIndex
      fi++
    }
  }

  const proj = new Float32Array(total * 5)

  const bloomCanvas = document.createElement('canvas')
  bloomCanvas.width = w
  bloomCanvas.height = h
  const bloomCtx = bloomCanvas.getContext('2d')
  if (!bloomCtx) throw new Error('2D context unavailable')

  const colorCache: ColorCache = [
    coralColor(0, 100),
    coralColor(1, 100),
    coralColor(2, 100),
    coralColor(3, 100),
  ]

  return {
    geom,
    proj,
    groupStart,
    fish,
    fishCount,
    colorCache,
    lastHealthKey: -1,
    bloomCanvas,
    bloomCtx,
    lastBloomHealthKey: -1,
    frame: 0,
    w,
    h,
  }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

function lerpRgb(a: string, b: string, t: number): [number, number, number] {
  const tc = Math.max(0, Math.min(1, t))
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return [
    Math.round(r1 + (r2 - r1) * tc),
    Math.round(g1 + (g2 - g1) * tc),
    Math.round(b1 + (b2 - b1) * tc),
  ]
}

function renderBloom(scene: Scene, health: number, cx: number, cy: number): void {
  const ctx = scene.bloomCtx
  const { w, h } = scene
  ctx.clearRect(0, 0, w, h)

  const bloomT = health < 60 ? (60 - health) / 60 : 0
  const [r, g, b] = lerpRgb('#081c12', '#1a1208', bloomT)
  const str = 0.05 + 0.16 * (health / 100)

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55)
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${str})`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function insertionSortByMidZ(geom: Float32Array, proj: Float32Array, start: number, end: number): void {
  // Sort ascending by proj[midZ] within [start, end).
  for (let i = start + 1; i < end; i++) {
    const pi = i * 5
    const gi = i * 8
    const midZ = proj[pi + 4]

    // Cache current rows
    const p0 = proj[pi + 0]
    const p1 = proj[pi + 1]
    const p2 = proj[pi + 2]
    const p3 = proj[pi + 3]

    const g0 = geom[gi + 0]
    const g1 = geom[gi + 1]
    const g2 = geom[gi + 2]
    const g3 = geom[gi + 3]
    const g4 = geom[gi + 4]
    const g5 = geom[gi + 5]
    const g6 = geom[gi + 6]
    const g7 = geom[gi + 7]

    let j = i - 1
    while (j >= start && proj[j * 5 + 4] > midZ) {
      const pj = j * 5
      const gj = j * 8
      // shift proj row up
      proj[pj + 5 + 0] = proj[pj + 0]
      proj[pj + 5 + 1] = proj[pj + 1]
      proj[pj + 5 + 2] = proj[pj + 2]
      proj[pj + 5 + 3] = proj[pj + 3]
      proj[pj + 5 + 4] = proj[pj + 4]
      // shift geom row up
      geom[gj + 8 + 0] = geom[gj + 0]
      geom[gj + 8 + 1] = geom[gj + 1]
      geom[gj + 8 + 2] = geom[gj + 2]
      geom[gj + 8 + 3] = geom[gj + 3]
      geom[gj + 8 + 4] = geom[gj + 4]
      geom[gj + 8 + 5] = geom[gj + 5]
      geom[gj + 8 + 6] = geom[gj + 6]
      geom[gj + 8 + 7] = geom[gj + 7]
      j--
    }

    const dstP = (j + 1) * 5
    const dstG = (j + 1) * 8
    proj[dstP + 0] = p0
    proj[dstP + 1] = p1
    proj[dstP + 2] = p2
    proj[dstP + 3] = p3
    proj[dstP + 4] = midZ

    geom[dstG + 0] = g0
    geom[dstG + 1] = g1
    geom[dstG + 2] = g2
    geom[dstG + 3] = g3
    geom[dstG + 4] = g4
    geom[dstG + 5] = g5
    geom[dstG + 6] = g6
    geom[dstG + 7] = g7
  }
}

function addFishBodyToPath(
  ctx: CanvasRenderingContext2D,
  fish: Float32Array,
  base: number,
  t: number,
  viewCos: number,
  viewSin: number,
  cx: number,
  cy: number
): void {
  const rx = fish[base + 0]
  const rz = fish[base + 1]
  const y = fish[base + 2]
  const phase = fish[base + 3]
  const speed = fish[base + 4]
  const bodyLen = fish[base + 5]
  const bodyH = fish[base + 6]

  const a = phase + t * speed
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const wx = ca * rx
  const wz = sa * rz

  // Tangent direction in world space.
  let tx = -sa * rx
  let tz = ca * rz
  const tl = Math.sqrt(tx * tx + tz * tz) || 1
  tx /= tl
  tz /= tl

  // Apply view rotation (same as coral).
  const x = wx * viewCos + wz * viewSin
  const z = -wx * viewSin + wz * viewCos
  const hx = (wx + tx * 22) * viewCos + (wz + tz * 22) * viewSin
  const hz = -(wx + tx * 22) * viewSin + (wz + tz * 22) * viewCos

  const zc = z + FOV
  const zhc = hz + FOV
  const sc = zc > 1 ? FOV / zc : 0.002
  const sh = zhc > 1 ? FOV / zhc : 0.002

  const sx = cx + x * sc
  const sy = cy - y * sc
  const shx = cx + hx * sh
  const shy = cy - y * sh

  const ang = Math.atan2(shy - sy, shx - sx)
  const rX = Math.max(0.8, (bodyLen * 0.5) * sc)
  const rY = Math.max(0.5, (bodyH * 0.5) * sc)

  // Body ellipse.
  ctx.ellipse(sx, sy, rX, rY, ang, 0, TAU)

  // Tail triangle.
  const tailBack = rX * 0.95
  const tailLen = rX * 0.85
  const tailHalfH = rY * 0.85
  const bx = sx - Math.cos(ang) * tailBack
  const by = sy - Math.sin(ang) * tailBack
  const px = -Math.sin(ang)
  const py = Math.cos(ang)
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - Math.cos(ang) * tailLen + px * tailHalfH, by - Math.sin(ang) * tailLen + py * tailHalfH)
  ctx.lineTo(bx - Math.cos(ang) * tailLen - px * tailHalfH, by - Math.sin(ang) * tailLen - py * tailHalfH)
  ctx.closePath()
}

function addFishEyeToPath(
  ctx: CanvasRenderingContext2D,
  fish: Float32Array,
  base: number,
  t: number,
  viewCos: number,
  viewSin: number,
  cx: number,
  cy: number
): void {
  const rx = fish[base + 0]
  const rz = fish[base + 1]
  const y = fish[base + 2]
  const phase = fish[base + 3]
  const speed = fish[base + 4]
  const bodyLen = fish[base + 5]
  const bodyH = fish[base + 6]

  const a = phase + t * speed
  const ca = Math.cos(a)
  const sa = Math.sin(a)
  const wx = ca * rx
  const wz = sa * rz

  let tx = -sa * rx
  let tz = ca * rz
  const tl = Math.sqrt(tx * tx + tz * tz) || 1
  tx /= tl
  tz /= tl

  const x = wx * viewCos + wz * viewSin
  const z = -wx * viewSin + wz * viewCos
  const hx = (wx + tx * 22) * viewCos + (wz + tz * 22) * viewSin
  const hz = -(wx + tx * 22) * viewSin + (wz + tz * 22) * viewCos

  const zc = z + FOV
  const zhc = hz + FOV
  const sc = zc > 1 ? FOV / zc : 0.002
  const sh = zhc > 1 ? FOV / zhc : 0.002
  const sx = cx + x * sc
  const sy = cy - y * sc
  const shx = cx + hx * sh
  const shy = cy - y * sh

  const ang = Math.atan2(shy - sy, shx - sx)
  const rX = Math.max(0.8, (bodyLen * 0.5) * sc)
  const rY = Math.max(0.5, (bodyH * 0.5) * sc)

  const px = -Math.sin(ang)
  const py = Math.cos(ang)
  const eyeX = sx + Math.cos(ang) * rX * 0.35 + px * rY * 0.10
  const eyeY = sy + Math.sin(ang) * rX * 0.35 + py * rY * 0.10
  const eyeR = Math.max(0.7, rY * 0.22)
  ctx.moveTo(eyeX + eyeR, eyeY)
  ctx.arc(eyeX, eyeY, eyeR, 0, TAU)
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number,
  health: number
): void {
  const { w, h, geom, proj, groupStart } = scene
  const cx   = w / 2
  const cy   = h * 0.50
  const rotY = (t / ROT_PERIOD) * TAU

  scene.frame++

  // Pure black background.
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  // Cache health-driven styles (only changes while scrubbing the slider).
  const healthKey = Math.round(health)
  if (healthKey !== scene.lastHealthKey) {
    scene.colorCache[0] = coralColor(0, health)
    scene.colorCache[1] = coralColor(1, health)
    scene.colorCache[2] = coralColor(2, health)
    scene.colorCache[3] = coralColor(3, health)
    scene.lastHealthKey = healthKey
  }
  if (healthKey !== scene.lastBloomHealthKey) {
    renderBloom(scene, health, cx, cy)
    scene.lastBloomHealthKey = healthKey
  }
  ctx.drawImage(scene.bloomCanvas, 0, 0)

  const c = Math.cos(rotY)
  const s = Math.sin(rotY)

  // Branch thinning (tissue loss) as health declines.
  const thicknessMult = 0.5 + 0.5 * (health / 100)

  // Rotate + project (zero allocations).
  let th0 = 0, th1 = 0, th2 = 0, th3 = 0
  const count0 = groupStart[1] - groupStart[0]
  const count1 = groupStart[2] - groupStart[1]
  const count2 = groupStart[3] - groupStart[2]
  const count3 = groupStart[4] - groupStart[3]

  for (let i = groupStart[0]; i < groupStart[1]; i++) {
    const gi = i * 8
    const pi = i * 5
    const p1x = geom[gi + 0], p1y = geom[gi + 1], p1z = geom[gi + 2]
    const p2x = geom[gi + 3], p2y = geom[gi + 4], p2z = geom[gi + 5]
    const tBase = geom[gi + 6]

    const rp1x = p1x * c + p1z * s
    const rp1z = -p1x * s + p1z * c
    const rp2x = p2x * c + p2z * s
    const rp2z = -p2x * s + p2z * c
    const midZ = (rp1z + rp2z) * 0.5

    const z1 = rp1z + FOV
    const z2 = rp2z + FOV
    const s1 = z1 > 1 ? FOV / z1 : 0.002
    const s2 = z2 > 1 ? FOV / z2 : 0.002
    const sAvg = (s1 + s2) * 0.5

    proj[pi + 0] = cx + rp1x * s1
    proj[pi + 1] = cy - p1y * s1
    proj[pi + 2] = cx + rp2x * s2
    proj[pi + 3] = cy - p2y * s2
    proj[pi + 4] = midZ

    th0 += tBase * sAvg
  }

  for (let i = groupStart[1]; i < groupStart[2]; i++) {
    const gi = i * 8
    const pi = i * 5
    const p1x = geom[gi + 0], p1y = geom[gi + 1], p1z = geom[gi + 2]
    const p2x = geom[gi + 3], p2y = geom[gi + 4], p2z = geom[gi + 5]
    const tBase = geom[gi + 6]

    const rp1x = p1x * c + p1z * s
    const rp1z = -p1x * s + p1z * c
    const rp2x = p2x * c + p2z * s
    const rp2z = -p2x * s + p2z * c
    const midZ = (rp1z + rp2z) * 0.5

    const z1 = rp1z + FOV
    const z2 = rp2z + FOV
    const s1 = z1 > 1 ? FOV / z1 : 0.002
    const s2 = z2 > 1 ? FOV / z2 : 0.002
    const sAvg = (s1 + s2) * 0.5

    proj[pi + 0] = cx + rp1x * s1
    proj[pi + 1] = cy - p1y * s1
    proj[pi + 2] = cx + rp2x * s2
    proj[pi + 3] = cy - p2y * s2
    proj[pi + 4] = midZ

    th1 += tBase * sAvg
  }

  for (let i = groupStart[2]; i < groupStart[3]; i++) {
    const gi = i * 8
    const pi = i * 5
    const p1x = geom[gi + 0], p1y = geom[gi + 1], p1z = geom[gi + 2]
    const p2x = geom[gi + 3], p2y = geom[gi + 4], p2z = geom[gi + 5]
    const tBase = geom[gi + 6]

    const rp1x = p1x * c + p1z * s
    const rp1z = -p1x * s + p1z * c
    const rp2x = p2x * c + p2z * s
    const rp2z = -p2x * s + p2z * c
    const midZ = (rp1z + rp2z) * 0.5

    const z1 = rp1z + FOV
    const z2 = rp2z + FOV
    const s1 = z1 > 1 ? FOV / z1 : 0.002
    const s2 = z2 > 1 ? FOV / z2 : 0.002
    const sAvg = (s1 + s2) * 0.5

    proj[pi + 0] = cx + rp1x * s1
    proj[pi + 1] = cy - p1y * s1
    proj[pi + 2] = cx + rp2x * s2
    proj[pi + 3] = cy - p2y * s2
    proj[pi + 4] = midZ

    th2 += tBase * sAvg
  }

  for (let i = groupStart[3]; i < groupStart[4]; i++) {
    const gi = i * 8
    const pi = i * 5
    const p1x = geom[gi + 0], p1y = geom[gi + 1], p1z = geom[gi + 2]
    const p2x = geom[gi + 3], p2y = geom[gi + 4], p2z = geom[gi + 5]
    const tBase = geom[gi + 6]

    const rp1x = p1x * c + p1z * s
    const rp1z = -p1x * s + p1z * c
    const rp2x = p2x * c + p2z * s
    const rp2z = -p2x * s + p2z * c
    const midZ = (rp1z + rp2z) * 0.5

    const z1 = rp1z + FOV
    const z2 = rp2z + FOV
    const s1 = z1 > 1 ? FOV / z1 : 0.002
    const s2 = z2 > 1 ? FOV / z2 : 0.002
    const sAvg = (s1 + s2) * 0.5

    proj[pi + 0] = cx + rp1x * s1
    proj[pi + 1] = cy - p1y * s1
    proj[pi + 2] = cx + rp2x * s2
    proj[pi + 3] = cy - p2y * s2
    proj[pi + 4] = midZ

    th3 += tBase * sAvg
  }

  const avgTh0 = count0 > 0 ? (th0 / count0) * thicknessMult : 1
  const avgTh1 = count1 > 0 ? (th1 / count1) * thicknessMult : 1
  const avgTh2 = count2 > 0 ? (th2 / count2) * thicknessMult : 1
  const avgTh3 = count3 > 0 ? (th3 / count3) * thicknessMult : 1

  // Depth sort (back → front) within each color group every 3rd frame.
  if (scene.frame % 3 === 0) {
    insertionSortByMidZ(geom, proj, groupStart[0], groupStart[1])
    insertionSortByMidZ(geom, proj, groupStart[1], groupStart[2])
    insertionSortByMidZ(geom, proj, groupStart[2], groupStart[3])
    insertionSortByMidZ(geom, proj, groupStart[3], groupStart[4])
  }

  const coralAlpha = 0.92
  const glowT = Math.max(0, Math.min(1, (health - 42) / 58))
  const glowAlpha = glowT * 0.22

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 4-batch draw (one path per color group). Glow uses filter blur (no shadowBlur in hot loop).
  for (let group = 0; group < 4; group++) {
    const start = groupStart[group]
    const end = groupStart[group + 1]

    ctx.beginPath()
    for (let i = start; i < end; i++) {
      const p = i * 5
      ctx.moveTo(proj[p + 0], proj[p + 1])
      ctx.lineTo(proj[p + 2], proj[p + 3])
    }

    const lineW = Math.max(
      0.4,
      group === 0 ? avgTh0 : group === 1 ? avgTh1 : group === 2 ? avgTh2 : avgTh3
    )

    if (glowAlpha > 0.002) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.filter = 'blur(8px)'
      ctx.globalAlpha = glowAlpha
      ctx.strokeStyle = HEALTHY_COLORS[group]
      ctx.lineWidth = lineW * 2.2
      ctx.stroke()
      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-over'
    }

    ctx.globalAlpha = coralAlpha
    ctx.strokeStyle = scene.colorCache[group]
    ctx.lineWidth = lineW
    ctx.stroke()
  }

  // Fish (drawn after coral; orbit order, no depth-sort per fish).
  const fish = scene.fish
  const maxFish = scene.fishCount
  const minFish = 2
  // Tie population decline to bleaching curve: once the reef is fully bleached (~50 health),
  // only a couple fish remain.
  const bleachT = Math.max(0, Math.min(1, (100 - health) / 50))
  const target = maxFish - (maxFish - minFish) * bleachT
  const clampedTarget = Math.max(minFish, Math.min(maxFish, target))
  const fullCount = Math.floor(clampedTarget)
  const fade = clampedTarget - fullCount
  const fadeIndex = fade > 0.001 && fullCount < maxFish ? fullCount : -1
  const fishBaseAlpha = 0.25 + 0.75 * (health / 100)

  // Bodies: batch by color for fully-visible fish.
  for (let group = 0; group < 4; group++) {
    ctx.beginPath()
    for (let idx = 0; idx < fullCount; idx++) {
      const base = idx * 8
      if ((fish[base + 7] | 0) !== group) continue
      addFishBodyToPath(ctx, fish, base, t, c, s, cx, cy)
    }
    ctx.globalAlpha = fishBaseAlpha
    ctx.fillStyle = HEALTHY_COLORS[group]
    ctx.fill()
  }

  // Fade fish (at most one).
  if (fadeIndex >= 0) {
    const base = fadeIndex * 8
    const group = fish[base + 7] | 0
    ctx.beginPath()
    addFishBodyToPath(ctx, fish, base, t, c, s, cx, cy)
    ctx.globalAlpha = fishBaseAlpha * fade
    ctx.fillStyle = HEALTHY_COLORS[group]
    ctx.fill()

    // Eye for fade fish.
    ctx.beginPath()
    addFishEyeToPath(ctx, fish, base, t, c, s, cx, cy)
    ctx.globalAlpha = fishBaseAlpha * fade
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.fill()
  }

  // Eyes: batch for fully-visible fish.
  ctx.beginPath()
  for (let idx = 0; idx < fullCount; idx++) {
    const base = idx * 8
    addFishEyeToPath(ctx, fish, base, t, c, s, cx, cy)
  }
  ctx.globalAlpha = fishBaseAlpha
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fill()
}

// ─── Stat row sub-component ───────────────────────────────────────────────────

function StatRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="crc-stat-row">
      <span className="crc-stat-label">{label}</span>
      <span className={`crc-stat-value${warn ? ' crc-stat-value--warn' : ''}`}>{value}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoralReefCanvas({
  title      = 'Coral Reef',
  subtitle,
  titleLevel = 2,
}: CoralReefCanvasProps) {
  const [selectedYear, setSelectedYear] = useState(LAST_YEAR)
  const yearRef     = useRef(LAST_YEAR)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const sceneRef    = useRef<Scene | null>(null)
  const rafRef      = useRef<number>(0)
  const startRef    = useRef<number>(0)
  const segCountRef = useRef<number>(0)

  useEffect(() => { yearRef.current = selectedYear }, [selectedYear])

  useEffect(() => {
    const maybeCanvas = canvasRef.current
    if (!maybeCanvas) return
    const canvas: HTMLCanvasElement = maybeCanvas

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const cw  = canvas.parentElement?.clientWidth ?? 900
      canvas.width        = cw * dpr
      canvas.height       = 560 * dpr
      canvas.style.width  = cw + 'px'
      canvas.style.height = '560px'
      sceneRef.current    = generateScene(canvas.width, canvas.height)
      segCountRef.current = sceneRef.current.geom.length / 8
    }

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick)
      const ctx = canvas.getContext('2d')
      if (!ctx || !sceneRef.current) return
      const t      = (now - startRef.current) / 1000
      const health = healthAtYear(yearRef.current)
      drawFrame(ctx, sceneRef.current, t, health)
    }

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    resize()
    startRef.current = performance.now()
    rafRef.current   = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  const health      = healthAtYear(selectedYear)
  const activeEvent = TIMELINE.find(p => p.year === selectedYear)?.event ?? null
  const isWarn      = health < 50

  const displayTitle    = title.toUpperCase()
  const displaySubtitle = (subtitle ?? 'BLEACHING INDEX · INDONESIA REEF SYSTEM').toUpperCase()

  const safeLevel = Math.max(1, Math.min(6, titleLevel)) as 1 | 2 | 3 | 4 | 5 | 6
  const TitleTag  = `h${safeLevel}` as `h${typeof safeLevel}`

  return (
    <section className="coral-reef-hero" aria-label="Coral reef health specimen viewer">

      <canvas ref={canvasRef} className="coral-reef-canvas" aria-hidden />

      {/* ── Header — top-left ──────────────────────────────────── */}
      <div className="crc-header">
        <TitleTag className="crc-header-title">{displayTitle}</TitleTag>
        <p className="crc-header-sub">{displaySubtitle}</p>
      </div>

      {/* ── Stats — top-right ──────────────────────────────────── */}
      <aside className="crc-stats" aria-label="Reef statistics" aria-live="polite">
        <StatRow label="YEAR"     value={String(selectedYear)} />
        <StatRow label="HEALTH"   value={`${Math.round(health)}%`}      warn={isWarn} />
        <StatRow label="COLONIES" value={String(COLONY_LAYOUT.length)} />
        <StatRow label="SEGMENTS" value={String(segCountRef.current)} />
        {activeEvent && <StatRow label="STATUS" value="BLEACHING" warn />}
      </aside>

      {/* ── Scrubber — bottom ──────────────────────────────────── */}
      <div className="crc-controls">
        <div className="crc-year-display">
          <span className="crc-year-num">{selectedYear}</span>
          {activeEvent
            ? <span className="crc-event-text">{activeEvent.toUpperCase()}</span>
            : <span className="crc-hint-text">DRAG TO EXPLORE HISTORY</span>
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
          <div className="crc-ticks" aria-hidden>
            {EVENT_YEARS.map(p => (
              <span
                key={p.year}
                className={`crc-tick${p.year === selectedYear ? ' crc-tick--active' : ''}`}
                style={{ left: `${((p.year - FIRST_YEAR) / YEAR_SPAN) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <div className="crc-range-ends">
          <span>{FIRST_YEAR}</span>
          <span>{LAST_YEAR}</span>
        </div>
      </div>

      <span className="coral-reef-hero__sr-text">
        3D coral reef health visualization. Use the year slider to explore bleaching events
        from {FIRST_YEAR} to {LAST_YEAR}.
      </span>
    </section>
  )
}
