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
import {
  EVENT_YEARS as GLOBAL_EVENT_YEARS,
  FIRST_YEAR as GLOBAL_FIRST_YEAR,
  LAST_YEAR as GLOBAL_LAST_YEAR,
  LAST_GCRMN_COVER_YEAR,
  reefHealthAtYear,
} from '@/data/reefHealthGlobal'

// ─── Props ────────────────────────────────────────────────────────────────────

type CanvasMode = 'reef-health' | 'reef-star-growth'

interface CoralReefCanvasProps {
  title?: string
  subtitle?: string
  variant?: string
  titleLevel?: number
  mode?: CanvasMode
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

const STAR_FIRST = 0
const STAR_LAST = 48 // months since installation
const STAR_SPAN = STAR_LAST - STAR_FIRST
const STAR_TICKS = [0, 12, 24, 36, 48] as const

function growthHealthAtAge(ageMonths: number): number {
  // 0 → 48 months since installation.
  // Ease-out so early months show visible change, while still allowing a long, gradual ramp.
  const a = Math.max(STAR_FIRST, Math.min(STAR_LAST, ageMonths))
  const t = STAR_SPAN === 0 ? 0 : (a - STAR_FIRST) / STAR_SPAN
  return 100 * Math.pow(t, 0.65)
}

function reefHealthIndexAtYear(year: number): { health: number; noaaAsOfDate?: string } {
  const sample = reefHealthAtYear(year)
  return { health: sample.health, noaaAsOfDate: sample.noaaAsOfDate }
}

function reefHeatStressOverlay01(year: number): number {
  // Visual storytelling overlay (not displayed as explanatory UI text):
  // We intensify stress during NOAA/GCRMN-linked global bleaching periods so the reef can visibly deteriorate,
  // even when the underlying monitored global-cover series changes slowly.
  // NOAA CRW confirms major global bleaching event years (1998, 2010, 2014–2017, and the ongoing 4th event from 2023+).
  if (year >= 2024) return 0.45
  if (year >= 2016) return 0.32
  if (year >= 2014) return 0.22
  if (year >= 2010) return 0.14
  if (year >= 1998) return 0.08
  return 0
}

function reefHealthVisualAtYear(year: number): { health: number; noaaAsOfDate?: string } {
  const base = reefHealthIndexAtYear(year)
  const overlay = reefHeatStressOverlay01(year)
  const health = Math.max(0, Math.min(100, base.health - overlay * 100))
  return { health, noaaAsOfDate: base.noaaAsOfDate }
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
const STAR_FRAGMENT_COLOR = '#7a5f3f'
const DEAD_ALGAE_COLOR = '#5a564c'
function coralColor(mode: CanvasMode, colorIndex: number, health: number): string {
  if (mode === 'reef-star-growth') {
    const t = Math.max(0, Math.min(1, health / 100))
    return lerpColor(STAR_FRAGMENT_COLOR, HEALTHY_COLORS[colorIndex % 4], Math.pow(t, 0.85))
  }
  // Keep the reef vibrant until a clear stress threshold, then push into stark bleaching.
  const bleachT = Math.max(0, Math.min(1, (92 - health) / 55))
  const algaeT = Math.max(0, Math.min(1, (48 - health) / 48))
  const bleached = lerpColor(HEALTHY_COLORS[colorIndex % 4], BLEACH_COLOR, bleachT)
  return lerpColor(bleached, DEAD_ALGAE_COLOR, algaeT * 0.85)
}

// ─── Scene ────────────────────────────────────────────────────────────────────

type GroupStart = [number, number, number, number, number]
type ColorCache = [string, string, string, string]

interface ReefGeom {
  // Geometry: [p1x, p1y, p1z, p2x, p2y, p2z, thickness, colorIndex] × N
  geom: Float32Array
  // Projected: [sx1, sy1, sx2, sy2, midZ] × N (kept in the same order as geom)
  proj: Float32Array
  // Per-segment tip factor (0 = base/core, 1 = outermost tips). Used for tissue-loss/growth reveal.
  tip: Float32Array
  // Pre-sorted by colorIndex: groupStart boundaries for 4 color groups
  groupStart: GroupStart
}

interface LineGeom {
  // Geometry: [p1x, p1y, p1z, p2x, p2y, p2z, thickness] × N
  geom: Float32Array
  // Projected: [sx1, sy1, sx2, sy2, midZ] × N
  proj: Float32Array
}

interface Scene {
  reefs: ReefGeom[]
  colonyCount: number
  segmentsTotal: number

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

  // Subtle post overlays (cached, no per-frame allocations).
  vignetteCanvas: HTMLCanvasElement
  grainCanvas: HTMLCanvasElement

  // Reef Star frame (growth mode only).
  reefStarFrame?: LineGeom
  reefStarTies?: LineGeom
  reefStarFragments?: LineGeom

  frame: number
  w: number
  h: number
}

function makeRng(seed: number): () => number {
  // Deterministic LCG (fast, good enough for layout jitter).
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function randPerp(rng: () => number, v: Vec3): Vec3 {
  for (let i = 0; i < 12; i++) {
    const r = v3.norm({ x: rng() - 0.5, y: rng() - 0.5, z: rng() - 0.5 })
    const d = v3.dot(r, v)
    const p = v3.norm({ x: r.x - d * v.x, y: r.y - d * v.y, z: r.z - d * v.z })
    if (p.x * p.x + p.y * p.y + p.z * p.z > 0.05) return p
  }
  return { x: 1, y: 0, z: 0 }
}

function buildBranches3D(
  p1: Vec3, dir: Vec3, length: number, thickness: number,
  depth: number, maxDepth: number, spreadRad: number, colorIndex: number,
  result: number[][],
  tipResult: number[][],
  rng: () => number
): void {
  if (depth < 0 || length < 0.5) return
  const p2 = v3.add(p1, v3.scale(dir, length))
  const out = result[colorIndex % 4]
  out.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, thickness)
  tipResult[colorIndex % 4].push(1 - depth / Math.max(1, maxDepth))

  const spread = spreadRad * (0.82 + rng() * 0.36)
  const perp   = randPerp(rng, dir)
  const d1     = v3.norm(v3.rotAround(dir, perp,  spread))
  const d2     = v3.norm(v3.rotAround(dir, perp, -spread))
  // Twist around growth axis so branches spread in full 3D
  const twist  = (rng() - 0.5) * 1.4
  const dt1    = v3.norm(v3.rotAround(d1, dir,  twist))
  const dt2    = v3.norm(v3.rotAround(d2, dir, -twist))

  buildBranches3D(p2, dt1, length * 0.68, thickness * 0.72, depth - 1, maxDepth, spreadRad, colorIndex, result, tipResult, rng)
  buildBranches3D(p2, dt2, length * 0.68, thickness * 0.72, depth - 1, maxDepth, spreadRad, colorIndex, result, tipResult, rng)
}

function buildReefLayout(colonyCount: number, rng: () => number): Array<{ phi: number; alpha: number }> {
  if (colonyCount <= 0) return []
  const layout: Array<{ phi: number; alpha: number }> = []
  // Always include an apex colony to keep the silhouette monumental/vertical (ARBORIST principle).
  layout.push({ phi: 18 + rng() * 6, alpha: rng() * 360 })
  for (let i = 1; i < colonyCount; i++) {
    const ringT = (i - 1) / Math.max(1, colonyCount - 2)
    const phi = 40 + ringT * 42 + (rng() - 0.5) * 10
    const alpha = rng() * 360
    layout.push({ phi, alpha })
  }
  return layout
}

function generateReefGeom(
  offset: Vec3,
  scale: number,
  colonyLayout: Array<{ phi: number; alpha: number }>,
  rng: () => number
): { reef: ReefGeom; colonies: number } {
  const branchesByColor: number[][] = [[], [], [], []]
  const tipByColor: number[][] = [[], [], [], []]
  const UP: Vec3 = { x: 0, y: 1, z: 0 }

  const bommieR = BOMMIE_R * scale
  const branchLen = BRANCH_LEN * scale

  colonyLayout.forEach(({ phi, alpha }, i) => {
    const phiR   = (phi   * Math.PI) / 180
    const alphaR = (alpha * Math.PI) / 180

    const local: Vec3 = {
      x: bommieR * Math.sin(phiR) * Math.cos(alphaR),
      y: bommieR * Math.cos(phiR),
      z: bommieR * Math.sin(phiR) * Math.sin(alphaR),
    }
    const origin: Vec3 = v3.add(offset, local)
    const normal = v3.norm(local)

    // Apex colonies grow mostly vertical; base colonies lean outward
    const blend  = phi < 45 ? 0.52 : 0.72
    const growDir = v3.norm({
      x: normal.x * blend + UP.x * (1 - blend),
      y: normal.y * blend + UP.y * (1 - blend),
      z: normal.z * blend + UP.z * (1 - blend),
    })

    const spreadRad = phi < 42
      ? (26 + rng() * 9)  * Math.PI / 180
      : (36 + rng() * 12) * Math.PI / 180

    const maxDepth = phi < 42 ? 5 : 4
    buildBranches3D(
      origin, growDir, branchLen,
      (4.6 + rng() * 1.4) * scale,
      maxDepth,
      maxDepth,
      spreadRad,
      i % 4,
      branchesByColor,
      tipByColor,
      rng
    )
  })

  const group0 = branchesByColor[0].length / 7
  const group1 = branchesByColor[1].length / 7
  const group2 = branchesByColor[2].length / 7
  const group3 = branchesByColor[3].length / 7
  const total  = group0 + group1 + group2 + group3

  const geom = new Float32Array(total * 8)
  const tip = new Float32Array(total)
  let writeIdx = 0
  let segIdx = 0
  for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
    const src = branchesByColor[colorIndex]
    const tipSrc = tipByColor[colorIndex]
    let k = 0
    for (let j = 0; j < src.length; j += 7) {
      geom[writeIdx + 0] = src[j + 0]
      geom[writeIdx + 1] = src[j + 1]
      geom[writeIdx + 2] = src[j + 2]
      geom[writeIdx + 3] = src[j + 3]
      geom[writeIdx + 4] = src[j + 4]
      geom[writeIdx + 5] = src[j + 5]
      geom[writeIdx + 6] = src[j + 6]
      geom[writeIdx + 7] = colorIndex
      tip[segIdx] = tipSrc[k] ?? 0
      writeIdx += 8
      segIdx++
      k++
    }
  }

  const groupStart: GroupStart = [
    0,
    group0,
    group0 + group1,
    group0 + group1 + group2,
    total,
  ]

  const proj = new Float32Array(total * 5)
  return { reef: { geom, proj, tip, groupStart }, colonies: colonyLayout.length }
}

function generateLinesGeom(segments: number[]): LineGeom {
  const geom = new Float32Array(segments)
  const count = segments.length / 7
  const proj = new Float32Array(count * 5)
  return { geom, proj }
}

function generateReefStarFrame(rng: () => number): { frame: LineGeom; ties: LineGeom; fragments: LineGeom; anchors: Vec3[] } {
  // 3D "Reef Star" wireframe:
  // - Approximate a sand-coated steel structure with depth (top + bottom rings + struts + legs).
  // - Coral fragments are represented as small strapped stubs at anchor points.
  //
  // References (for shape/storytelling; exact dimensions are not required here):
  // - MARRS Reef Stars are modular hexagonal steel structures interlocked over rubble, with coral fragments attached.
  //   (See: GBR Biology summary / Reef Magic deployment notes) https://www.gbrbiology.com/2022/04/08/mars-and-coral-rubble-stabilisation/
  const STAR_R_TOP = 122
  const STAR_R_BOT = 108
  const STAR_Y_TOP = -42
  const STAR_Y_BOT = -62
  const LEG_Y = -86

  const vertsTop: Vec3[] = []
  const vertsBot: Vec3[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU
    vertsTop.push({ x: Math.cos(a) * STAR_R_TOP, y: STAR_Y_TOP, z: Math.sin(a) * STAR_R_TOP })
    // Slight twist so it reads as a 3D frame during rotation.
    const b = a + 0.18
    vertsBot.push({ x: Math.cos(b) * STAR_R_BOT, y: STAR_Y_BOT, z: Math.sin(b) * STAR_R_BOT })
  }
  const centerTop: Vec3 = { x: 0, y: STAR_Y_TOP, z: 0 }
  const centerBot: Vec3 = { x: 0, y: STAR_Y_BOT, z: 0 }

  const segs: number[] = []
  const ties: number[] = []
  const fragments: number[] = []

  function addSeg(a: Vec3, b: Vec3, thick: number) {
    segs.push(a.x, a.y, a.z, b.x, b.y, b.z, thick)
  }
  function addTie(p: Vec3, tangent: Vec3, thick: number) {
    const len = 12 + rng() * 6
    ties.push(
      p.x - tangent.x * len, p.y + 2, p.z - tangent.z * len,
      p.x + tangent.x * len, p.y + 2, p.z + tangent.z * len,
      thick
    )
  }
  function addFragment(p: Vec3, dir: Vec3, thick: number) {
    const len = 9 + rng() * 7
    fragments.push(
      p.x, p.y, p.z,
      p.x + dir.x * len, p.y + dir.y * len, p.z + dir.z * len,
      thick
    )
  }

  // Top + bottom hex rings.
  for (let i = 0; i < 6; i++) addSeg(vertsTop[i], vertsTop[(i + 1) % 6], 2.6)
  for (let i = 0; i < 6; i++) addSeg(vertsBot[i], vertsBot[(i + 1) % 6], 2.1)

  // Struts between rings (gives depth).
  for (let i = 0; i < 6; i++) addSeg(vertsTop[i], vertsBot[i], 1.7)

  // Spokes (top and bottom).
  for (let i = 0; i < 6; i++) addSeg(vertsTop[i], centerTop, 2.1)
  for (let i = 0; i < 6; i++) addSeg(vertsBot[i], centerBot, 1.7)

  // Diagonals on top ring for "star" read.
  for (let i = 0; i < 6; i++) addSeg(vertsTop[i], vertsTop[(i + 2) % 6], 1.6)

  // Legs (suggests it sits above rubble; helps 3D read).
  for (let i = 0; i < 6; i++) {
    const v = vertsBot[i]
    addSeg(v, { x: v.x * 0.92, y: LEG_Y, z: v.z * 0.92 }, 1.5)
  }

  // Attachment anchors: vertices + mid-spokes (where fragments would be tied).
  const anchors: Vec3[] = []
  for (let i = 0; i < 6; i++) {
    const v = vertsTop[i]
    anchors.push({ x: v.x, y: v.y + 3, z: v.z })
    anchors.push({ x: v.x * 0.55, y: v.y + 2, z: v.z * 0.55 })

    // Tie stroke tangent around the ring.
    const a = (i / 6) * TAU
    const tx = -Math.sin(a)
    const tz = Math.cos(a)
    addTie({ x: v.x * 0.80, y: v.y, z: v.z * 0.80 }, { x: tx, y: 0, z: tz }, 1.4)

    // Fragment stubs (look like strapped coral pieces at Month 0).
    addFragment(
      { x: v.x * 0.92, y: v.y + 1, z: v.z * 0.92 },
      v3.norm({ x: tx * 0.15, y: 1, z: tz * 0.15 }),
      2.2
    )
  }

  return { frame: generateLinesGeom(segs), ties: generateLinesGeom(ties), fragments: generateLinesGeom(fragments), anchors }
}

function generateCoralFromAnchors(anchors: Vec3[], rng: () => number): { reef: ReefGeom; colonies: number } {
  const branchesByColor: number[][] = [[], [], [], []]
  const tipByColor: number[][] = [[], [], [], []]

  for (let i = 0; i < anchors.length; i++) {
    const origin = anchors[i]
    const outward = v3.norm({ x: origin.x, y: 0, z: origin.z })
    const growDir = v3.norm({ x: outward.x * 0.22, y: 1, z: outward.z * 0.22 })

    const spreadRad = (26 + rng() * 12) * Math.PI / 180
    const maxDepth = 6
    buildBranches3D(
      origin,
      growDir,
      24,
      3.4 + rng() * 1.0,
      maxDepth,
      maxDepth,
      spreadRad,
      i % 4,
      branchesByColor,
      tipByColor,
      rng
    )
  }

  const group0 = branchesByColor[0].length / 7
  const group1 = branchesByColor[1].length / 7
  const group2 = branchesByColor[2].length / 7
  const group3 = branchesByColor[3].length / 7
  const total  = group0 + group1 + group2 + group3

  const geom = new Float32Array(total * 8)
  const tip = new Float32Array(total)
  let writeIdx = 0
  let segIdx = 0
  for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
    const src = branchesByColor[colorIndex]
    const tipSrc = tipByColor[colorIndex]
    let k = 0
    for (let j = 0; j < src.length; j += 7) {
      geom[writeIdx + 0] = src[j + 0]
      geom[writeIdx + 1] = src[j + 1]
      geom[writeIdx + 2] = src[j + 2]
      geom[writeIdx + 3] = src[j + 3]
      geom[writeIdx + 4] = src[j + 4]
      geom[writeIdx + 5] = src[j + 5]
      geom[writeIdx + 6] = src[j + 6]
      geom[writeIdx + 7] = colorIndex
      tip[segIdx] = tipSrc[k] ?? 0
      writeIdx += 8
      segIdx++
      k++
    }
  }

  const groupStart: GroupStart = [
    0,
    group0,
    group0 + group1,
    group0 + group1 + group2,
    total,
  ]

  const proj = new Float32Array(total * 5)
  return { reef: { geom, proj, tip, groupStart }, colonies: anchors.length }
}

function generateScene(w: number, h: number, mode: CanvasMode): Scene {
  const reefs: ReefGeom[] = []
  let colonyCount = 0
  let reefStarFrame: LineGeom | undefined
  let reefStarTies: LineGeom | undefined
  let reefStarFragments: LineGeom | undefined

  if (mode === 'reef-health') {
    // A small reef field early, tapering down to a single survivor by TODAY.
    const offsets: Vec3[] = [
      { x: 0, y: 0, z: 0 },
      { x: -220, y: -6, z: 110 },
      { x: 220, y: 6, z: 80 },
      { x: -140, y: 10, z: -190 },
      { x: 150, y: -10, z: -160 },
      { x: 0, y: 18, z: 240 },
    ]
    const scales = [1.0, 0.78, 0.82, 0.74, 0.76, 0.70]
    const coloniesPerReef = [4, 3, 3, 3, 3, 3]

    for (let r = 0; r < offsets.length; r++) {
      const rng = makeRng(1337 + r * 9973)
      const layout = buildReefLayout(coloniesPerReef[r], rng)
      const { reef, colonies } = generateReefGeom(offsets[r], scales[r], layout, rng)
      reefs.push(reef)
      colonyCount += colonies
    }
  } else {
    const rng = makeRng(424242)
    const star = generateReefStarFrame(rng)
    reefStarFrame = star.frame
    reefStarTies = star.ties
    reefStarFragments = star.fragments
    const coral = generateCoralFromAnchors(star.anchors, rng)
    reefs.push(coral.reef)
    colonyCount += coral.colonies
  }

  const segmentsTotal = reefs.reduce((sum, r) => sum + r.geom.length / 8, 0)

  // Fish: 12 on 3 orbital rings (inner/mid/outer), orbit order.
  const fishCount = 12
  const fish = new Float32Array(fishCount * 8)
  const ringR = mode === 'reef-health' ? [240, 320, 420] : [160, 220, 290]
  const fishRng = makeRng(mode === 'reef-health' ? 9001 : 9002)
  let fi = 0
  for (let ring = 0; ring < 3; ring++) {
    for (let k = 0; k < 4; k++) {
      const base = fi * 8
      const r = ringR[ring]
      const orbitRadiusX = r * (0.9 + fishRng() * 0.25)
      const orbitRadiusZ = r * (0.9 + fishRng() * 0.25)
      const orbitY = 18 + ring * 12 + fishRng() * 16
      const orbitPhase = fishRng() * TAU
      const orbitSpeed = 0.3 + fishRng() * 0.6
      const bodyLen = 18 + fishRng() * 10
      const bodyH = 6 + fishRng() * 4
      const colorIndex = Math.floor(fishRng() * 4)

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

  const bloomCanvas = document.createElement('canvas')
  bloomCanvas.width = w
  bloomCanvas.height = h
  const bloomCtx = bloomCanvas.getContext('2d')
  if (!bloomCtx) throw new Error('2D context unavailable')

  const colorCache: ColorCache = [
    coralColor('reef-health', 0, 100),
    coralColor('reef-health', 1, 100),
    coralColor('reef-health', 2, 100),
    coralColor('reef-health', 3, 100),
  ]

  // Vignette (subtle, keeps focus on the specimen).
  const vignetteCanvas = document.createElement('canvas')
  vignetteCanvas.width = w
  vignetteCanvas.height = h
  const vignetteCtx = vignetteCanvas.getContext('2d')
  if (!vignetteCtx) throw new Error('2D context unavailable')
  vignetteCtx.clearRect(0, 0, w, h)
  const vg = vignetteCtx.createRadialGradient(w * 0.5, h * 0.52, Math.min(w, h) * 0.12, w * 0.5, h * 0.52, Math.min(w, h) * 0.62)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.55)')
  vignetteCtx.fillStyle = vg
  vignetteCtx.fillRect(0, 0, w, h)

  // Film grain (cached noise tile).
  const grainCanvas = document.createElement('canvas')
  grainCanvas.width = 256
  grainCanvas.height = 256
  const grainCtx = grainCanvas.getContext('2d')
  if (!grainCtx) throw new Error('2D context unavailable')
  const img = grainCtx.createImageData(256, 256)
  const data = img.data
  const grainRng = makeRng(7777)
  for (let i = 0; i < data.length; i += 4) {
    const n = Math.floor(90 + grainRng() * 110)
    data[i + 0] = n
    data[i + 1] = n
    data[i + 2] = n
    data[i + 3] = 18
  }
  grainCtx.putImageData(img, 0, 0)

  return {
    reefs,
    colonyCount,
    segmentsTotal,
    fish,
    fishCount,
    colorCache,
    lastHealthKey: -1,
    bloomCanvas,
    bloomCtx,
    lastBloomHealthKey: -1,
    vignetteCanvas,
    grainCanvas,
    reefStarFrame,
    reefStarTies,
    reefStarFragments,
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

function renderBloom(scene: Scene, health: number, cx: number, cy: number, mode: CanvasMode): void {
  const ctx = scene.bloomCtx
  const { w, h } = scene
  ctx.clearRect(0, 0, w, h)

  const health01 = Math.max(0, Math.min(1, health / 100))
  const bloomT = mode === 'reef-health'
    ? (health < 60 ? (60 - health) / 60 : 0)
    : (1 - health01) * 0.35

  const [r, g, b] = mode === 'reef-health'
    ? lerpRgb('#081c12', '#1a1208', bloomT)
    : lerpRgb('#03060a', '#071812', bloomT)

  const str = mode === 'reef-health'
    ? (0.05 + 0.16 * health01)
    : (0.03 + 0.14 * health01)

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.55)
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${str})`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function insertionSortByMidZ(geom: Float32Array, proj: Float32Array, tip: Float32Array, start: number, end: number): void {
  // Sort ascending by proj[midZ] within [start, end).
  for (let i = start + 1; i < end; i++) {
    const pi = i * 5
    const gi = i * 8
    const midZ = proj[pi + 4]
    const tipV = tip[i]

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
      tip[j + 1] = tip[j]
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
    tip[j + 1] = tipV
  }
}

function addFishBodyToPath(
  ctx: CanvasRenderingContext2D,
  fish: Float32Array,
  base: number,
  t: number,
  viewCos: number,
  viewSin: number,
  ox: number,
  oy: number,
  zoom: number
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

  const sx = ox + x * sc * zoom
  const sy = oy - y * sc * zoom
  const shx = ox + hx * sh * zoom
  const shy = oy - y * sh * zoom

  const ang = Math.atan2(shy - sy, shx - sx)
  const rX = Math.max(0.8, (bodyLen * 0.5) * sc * zoom)
  const rY = Math.max(0.5, (bodyH * 0.5) * sc * zoom)

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
  ox: number,
  oy: number,
  zoom: number
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
  const sx = ox + x * sc * zoom
  const sy = oy - y * sc * zoom
  const shx = ox + hx * sh * zoom
  const shy = oy - y * sh * zoom

  const ang = Math.atan2(shy - sy, shx - sx)
  const rX = Math.max(0.8, (bodyLen * 0.5) * sc * zoom)
  const rY = Math.max(0.5, (bodyH * 0.5) * sc * zoom)

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
  health: number,
  mode: CanvasMode,
  zoom: number,
  panX: number,
  panY: number,
  value: number
): void {
  const { w, h, reefs } = scene
  const cx   = w / 2
  // Frame position: keep Reef Health centered; push Reef Star slightly lower to feel more monumental.
  const cy   = mode === 'reef-health' ? (h * 0.50) : (h * 0.54)
  const ox = cx + panX
  const oy = cy + panY
  const rotY = (t / ROT_PERIOD) * TAU

  scene.frame++

  // Pure black background.
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  // Cache health-driven styles (only changes while scrubbing the slider).
  const healthKey = Math.round(health)
  if (healthKey !== scene.lastHealthKey) {
    scene.colorCache[0] = coralColor(mode, 0, health)
    scene.colorCache[1] = coralColor(mode, 1, health)
    scene.colorCache[2] = coralColor(mode, 2, health)
    scene.colorCache[3] = coralColor(mode, 3, health)
    scene.lastHealthKey = healthKey
  }
  if (healthKey !== scene.lastBloomHealthKey) {
    renderBloom(scene, health, cx, cy, mode)
    scene.lastBloomHealthKey = healthKey
  }
  ctx.drawImage(scene.bloomCanvas, 0, 0)

  const c = Math.cos(rotY)
  const s = Math.sin(rotY)

  const health01 = Math.max(0, Math.min(1, health / 100))
  const stressBase01 = Math.max(0, Math.min(1, (100 - health) / 100))

  // Storytelling controls:
  // - Reef Health: multiple reefs early, fewer survivors later; tips die back and branches shrink under stress.
  // - Reef Star Growth: structure reveals outward as the coral grows.
  let reefVisibleCount = 1
  let stress01 = stressBase01
  let keepTip01 = 1
  let shrinkBase = 0

  if (mode === 'reef-health') {
    const year = value
    reefVisibleCount =
      year < 1998 ? 6 :
        year < 2010 ? 5 :
          year < 2014 ? 4 :
            year < 2016 ? 3 :
              year < 2024 ? 2 : 1
    stress01 = stressBase01
    // Keep a strong readable silhouette even in extreme years (avoid "nothing visible" failure mode).
    keepTip01 = Math.max(0.14, Math.min(1, 1 - 0.88 * Math.pow(stress01, 0.9)))
    shrinkBase = 0.58 * Math.pow(stress01, 1.15)
  } else {
    reefVisibleCount = 1
    keepTip01 = Math.max(0.08, Math.min(1, 0.08 + 0.92 * Math.pow(health01, 1.05)))
    shrinkBase = 0
  }

  // Branch thickness changes (tissue loss vs regrowth).
  const thicknessMult = mode === 'reef-star-growth'
    ? (0.18 + 1.05 * health01)
    : (0.22 + 0.92 * (1 - stress01))

  const coralAlpha = 0.92
  const glowT = mode === 'reef-star-growth'
    ? Math.pow(health01, 1.2)
    : Math.max(0, Math.min(1, (health - 74) / 26))
  const glowAlpha = glowT * 0.20

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Reef Star frame (growth mode): visible at Month 0, gradually engulfed by coral by Month 48.
  if (mode === 'reef-star-growth' && scene.reefStarFrame) {
    const frame = scene.reefStarFrame
    const ties = scene.reefStarTies
    const fragments = scene.reefStarFragments
    const segCount = frame.geom.length / 7

    const frameAlpha = Math.max(0, Math.min(0.9, 0.9 * Math.pow(1 - health01, 0.9)))
    if (frameAlpha > 0.002) {
      for (let i = 0; i < segCount; i++) {
        const gi = i * 7
        const pi = i * 5
        const p1x = frame.geom[gi + 0], p1y = frame.geom[gi + 1], p1z = frame.geom[gi + 2]
        const p2x = frame.geom[gi + 3], p2y = frame.geom[gi + 4], p2z = frame.geom[gi + 5]

        const rp1x = p1x * c + p1z * s
        const rp1z = -p1x * s + p1z * c
        const rp2x = p2x * c + p2z * s
        const rp2z = -p2x * s + p2z * c
        const midZ = (rp1z + rp2z) * 0.5

        const z1 = rp1z + FOV
        const z2 = rp2z + FOV
        const s1 = z1 > 1 ? FOV / z1 : 0.002
        const s2 = z2 > 1 ? FOV / z2 : 0.002

        frame.proj[pi + 0] = ox + rp1x * s1 * zoom
        frame.proj[pi + 1] = oy - p1y * s1 * zoom
        frame.proj[pi + 2] = ox + rp2x * s2 * zoom
        frame.proj[pi + 3] = oy - p2y * s2 * zoom
        frame.proj[pi + 4] = midZ
      }

      ctx.beginPath()
      for (let i = 0; i < segCount; i++) {
        const p = i * 5
        ctx.moveTo(frame.proj[p + 0], frame.proj[p + 1])
        ctx.lineTo(frame.proj[p + 2], frame.proj[p + 3])
      }

      const lw = Math.max(0.9, 1.8 * zoom)
      ctx.globalCompositeOperation = 'lighter'
      ctx.filter = 'blur(6px)'
      ctx.globalAlpha = frameAlpha * 0.25
      ctx.strokeStyle = '#b8c0cc'
      ctx.lineWidth = lw * 2.2
      ctx.stroke()

      ctx.filter = 'none'
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = frameAlpha
      ctx.strokeStyle = '#7f8896'
      ctx.lineWidth = lw
      ctx.stroke()

      if (ties) {
        const tieSegCount = ties.geom.length / 7
        for (let i = 0; i < tieSegCount; i++) {
          const gi = i * 7
          const pi = i * 5
          const p1x = ties.geom[gi + 0], p1y = ties.geom[gi + 1], p1z = ties.geom[gi + 2]
          const p2x = ties.geom[gi + 3], p2y = ties.geom[gi + 4], p2z = ties.geom[gi + 5]

          const rp1x = p1x * c + p1z * s
          const rp1z = -p1x * s + p1z * c
          const rp2x = p2x * c + p2z * s
          const rp2z = -p2x * s + p2z * c
          const midZ = (rp1z + rp2z) * 0.5

          const z1 = rp1z + FOV
          const z2 = rp2z + FOV
          const s1 = z1 > 1 ? FOV / z1 : 0.002
          const s2 = z2 > 1 ? FOV / z2 : 0.002

          ties.proj[pi + 0] = ox + rp1x * s1 * zoom
          ties.proj[pi + 1] = oy - p1y * s1 * zoom
          ties.proj[pi + 2] = ox + rp2x * s2 * zoom
          ties.proj[pi + 3] = oy - p2y * s2 * zoom
          ties.proj[pi + 4] = midZ
        }

        ctx.beginPath()
        for (let i = 0; i < tieSegCount; i++) {
          const p = i * 5
          ctx.moveTo(ties.proj[p + 0], ties.proj[p + 1])
          ctx.lineTo(ties.proj[p + 2], ties.proj[p + 3])
        }

        ctx.globalAlpha = frameAlpha * 0.85
        ctx.strokeStyle = '#cda15f'
        ctx.lineWidth = Math.max(0.6, 1.05 * zoom)
        ctx.stroke()
      }

      if (fragments) {
        const fragSegCount = fragments.geom.length / 7
        for (let i = 0; i < fragSegCount; i++) {
          const gi = i * 7
          const pi = i * 5
          const p1x = fragments.geom[gi + 0], p1y = fragments.geom[gi + 1], p1z = fragments.geom[gi + 2]
          const p2x = fragments.geom[gi + 3], p2y = fragments.geom[gi + 4], p2z = fragments.geom[gi + 5]

          const rp1x = p1x * c + p1z * s
          const rp1z = -p1x * s + p1z * c
          const rp2x = p2x * c + p2z * s
          const rp2z = -p2x * s + p2z * c
          const midZ = (rp1z + rp2z) * 0.5

          const z1 = rp1z + FOV
          const z2 = rp2z + FOV
          const s1 = z1 > 1 ? FOV / z1 : 0.002
          const s2 = z2 > 1 ? FOV / z2 : 0.002

          fragments.proj[pi + 0] = ox + rp1x * s1 * zoom
          fragments.proj[pi + 1] = oy - p1y * s1 * zoom
          fragments.proj[pi + 2] = ox + rp2x * s2 * zoom
          fragments.proj[pi + 3] = oy - p2y * s2 * zoom
          fragments.proj[pi + 4] = midZ
        }

        ctx.beginPath()
        for (let i = 0; i < fragSegCount; i++) {
          const p = i * 5
          ctx.moveTo(fragments.proj[p + 0], fragments.proj[p + 1])
          ctx.lineTo(fragments.proj[p + 2], fragments.proj[p + 3])
        }

        // "Fragment stubs" read as strapped coral pieces at Month 0.
        ctx.globalCompositeOperation = 'lighter'
        ctx.filter = 'blur(7px)'
        ctx.globalAlpha = Math.min(0.35, frameAlpha * 0.28)
        ctx.strokeStyle = '#e0b26c'
        ctx.lineWidth = Math.max(0.9, 2.2 * zoom)
        ctx.stroke()
        ctx.filter = 'none'
        ctx.globalCompositeOperation = 'source-over'

        ctx.globalAlpha = Math.min(0.9, frameAlpha)
        ctx.strokeStyle = '#8b6a3a'
        ctx.lineWidth = Math.max(0.75, 1.55 * zoom)
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.filter = 'none'
  }

  const reefsToDraw = Math.max(0, Math.min(reefs.length, reefVisibleCount))
  for (let reefIndex = 0; reefIndex < reefsToDraw; reefIndex++) {
    const reef = reefs[reefIndex]
    const { geom, proj, groupStart, tip } = reef
    const reefFade = mode === 'reef-health' ? Math.max(0.55, 1 - reefIndex * 0.10) : 1

    let th0 = 0, th1 = 0, th2 = 0, th3 = 0
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0

    // Rotate + project (zero allocations).
    for (let group = 0; group < 4; group++) {
      const start = groupStart[group]
      const end = groupStart[group + 1]
      for (let i = start; i < end; i++) {
        const tip01 = tip[i]
        const pi = i * 5
        if (tip01 > keepTip01) {
          proj[pi + 4] = -1e9
          continue
        }

        const gi = i * 8
        const p1x = geom[gi + 0], p1y = geom[gi + 1], p1z = geom[gi + 2]
        const p2x = geom[gi + 3], p2y = geom[gi + 4], p2z = geom[gi + 5]
        const tBase = geom[gi + 6]

        const rp1x = p1x * c + p1z * s
        const rp1z = -p1x * s + p1z * c
        const rp2x0 = p2x * c + p2z * s
        const rp2z0 = -p2x * s + p2z * c

        const shrink = shrinkBase > 0 ? (1 - shrinkBase * tip01) : 1
        const rp2x = rp1x + (rp2x0 - rp1x) * shrink
        const rp2z = rp1z + (rp2z0 - rp1z) * shrink
        const rp2y = p1y + (p2y - p1y) * shrink

        const midZ = (rp1z + rp2z) * 0.5

        const z1 = rp1z + FOV
        const z2 = rp2z + FOV
        const s1 = z1 > 1 ? FOV / z1 : 0.002
        const s2 = z2 > 1 ? FOV / z2 : 0.002
        const sAvg = (s1 + s2) * 0.5

        proj[pi + 0] = ox + rp1x * s1 * zoom
        proj[pi + 1] = oy - p1y * s1 * zoom
        proj[pi + 2] = ox + rp2x * s2 * zoom
        proj[pi + 3] = oy - rp2y * s2 * zoom
        proj[pi + 4] = midZ

        if (group === 0) { th0 += tBase * sAvg; n0++ }
        else if (group === 1) { th1 += tBase * sAvg; n1++ }
        else if (group === 2) { th2 += tBase * sAvg; n2++ }
        else { th3 += tBase * sAvg; n3++ }
      }
    }

    const avgTh0 = n0 > 0 ? (th0 / n0) * thicknessMult : 1
    const avgTh1 = n1 > 0 ? (th1 / n1) * thicknessMult : 1
    const avgTh2 = n2 > 0 ? (th2 / n2) * thicknessMult : 1
    const avgTh3 = n3 > 0 ? (th3 / n3) * thicknessMult : 1

    // Depth sort (back → front) within each color group every 3rd frame.
    if (scene.frame % 3 === 0) {
      insertionSortByMidZ(geom, proj, tip, groupStart[0], groupStart[1])
      insertionSortByMidZ(geom, proj, tip, groupStart[1], groupStart[2])
      insertionSortByMidZ(geom, proj, tip, groupStart[2], groupStart[3])
      insertionSortByMidZ(geom, proj, tip, groupStart[3], groupStart[4])
    }

    // 4-batch draw (one path per color group). Glow uses filter blur (no shadowBlur in hot loop).
    for (let group = 0; group < 4; group++) {
      const start = groupStart[group]
      const end = groupStart[group + 1]

      ctx.beginPath()
      for (let i = start; i < end; i++) {
        if (tip[i] > keepTip01) continue
        const p = i * 5
        if (proj[p + 4] <= -1e8) continue
        ctx.moveTo(proj[p + 0], proj[p + 1])
        ctx.lineTo(proj[p + 2], proj[p + 3])
      }

      const lineW = Math.max(
        0.35,
        group === 0 ? avgTh0 : group === 1 ? avgTh1 : group === 2 ? avgTh2 : avgTh3
      )

      if (glowAlpha > 0.002) {
        ctx.globalCompositeOperation = 'lighter'
        ctx.filter = 'blur(8px)'
        ctx.globalAlpha = glowAlpha * reefFade
        ctx.strokeStyle = HEALTHY_COLORS[group]
        ctx.lineWidth = lineW * 2.2
        ctx.stroke()
        ctx.filter = 'none'
        ctx.globalCompositeOperation = 'source-over'
      }

      ctx.globalAlpha = coralAlpha * reefFade
      ctx.strokeStyle = scene.colorCache[group]
      ctx.lineWidth = lineW
      ctx.stroke()
    }
  }

  // Fish (drawn after coral; orbit order, no depth-sort per fish).
  const fish = scene.fish
  const maxFish = scene.fishCount
  const minFish = mode === 'reef-star-growth' ? 1 : 2
  const target = mode === 'reef-star-growth'
    ? (minFish + (maxFish - minFish) * Math.pow(health01, 1.35))
    : (maxFish - (maxFish - minFish) * Math.max(0, Math.min(1, (100 - health) / 50)))
  const clampedTarget = Math.max(minFish, Math.min(maxFish, target))
  const fullCount = Math.floor(clampedTarget)
  const fade = clampedTarget - fullCount
  const fadeIndex = fade > 0.001 && fullCount < maxFish ? fullCount : -1
  const fishBaseAlpha = mode === 'reef-star-growth'
    ? (0.18 + 0.82 * health01)
    : (0.18 + 0.82 * (1 - stress01))

  // Bodies: batch by color for fully-visible fish.
  for (let group = 0; group < 4; group++) {
    ctx.beginPath()
    for (let idx = 0; idx < fullCount; idx++) {
      const base = idx * 8
      if ((fish[base + 7] | 0) !== group) continue
      addFishBodyToPath(ctx, fish, base, t, c, s, ox, oy, zoom)
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
    addFishBodyToPath(ctx, fish, base, t, c, s, ox, oy, zoom)
    ctx.globalAlpha = fishBaseAlpha * fade
    ctx.fillStyle = HEALTHY_COLORS[group]
    ctx.fill()

    // Eye for fade fish.
    ctx.beginPath()
    addFishEyeToPath(ctx, fish, base, t, c, s, ox, oy, zoom)
    ctx.globalAlpha = fishBaseAlpha * fade
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.fill()
  }

  // Eyes: batch for fully-visible fish.
  ctx.beginPath()
  for (let idx = 0; idx < fullCount; idx++) {
    const base = idx * 8
    addFishEyeToPath(ctx, fish, base, t, c, s, ox, oy, zoom)
  }
  ctx.globalAlpha = fishBaseAlpha
  ctx.fillStyle = 'rgba(0,0,0,0.85)'
  ctx.fill()

  // Subtle post overlays (ARBORIST: felt, not seen).
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.drawImage(scene.vignetteCanvas, 0, 0)
  ctx.globalAlpha = mode === 'reef-star-growth' ? 0.05 : 0.06
  ctx.globalCompositeOperation = 'overlay'
  ctx.drawImage(scene.grainCanvas, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
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
  variant,
  titleLevel = 2,
  mode = 'reef-health',
}: CoralReefCanvasProps) {
  const isReefHealth = mode === 'reef-health'
  const minValue = isReefHealth ? GLOBAL_FIRST_YEAR : STAR_FIRST
  const maxValue = isReefHealth ? GLOBAL_LAST_YEAR : STAR_LAST
  const span = maxValue - minValue || 1

  const [selectedValue, setSelectedValue] = useState<number>(maxValue)
  const valueRef = useRef<number>(maxValue)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const sceneRef    = useRef<Scene | null>(null)
  const rafRef      = useRef<number>(0)
  const startRef    = useRef<number>(0)
  const segCountRef = useRef<number>(0)
  const colonyCountRef = useRef<number>(0)

  // View transform refs (no React state updates per-frame / per-pointermove).
  const zoomRef = useRef(1)
  const panXRef = useRef(0)
  const panYRef = useRef(0)
  const dprRef = useRef(1)

  useEffect(() => {
    setSelectedValue(maxValue)
    valueRef.current = maxValue
  }, [maxValue])

  useEffect(() => { valueRef.current = selectedValue }, [selectedValue])

  useEffect(() => {
    const maybeCanvas = canvasRef.current
    if (!maybeCanvas) return
    const canvas: HTMLCanvasElement = maybeCanvas

    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'none'

    function clampView() {
      const scene = sceneRef.current
      if (!scene) return
      const z = Math.max(0.75, Math.min(2.5, zoomRef.current))
      zoomRef.current = z

      const maxPanX = scene.w * 0.40 * z
      const maxPanY = scene.h * 0.28 * z
      panXRef.current = Math.max(-maxPanX, Math.min(maxPanX, panXRef.current))
      panYRef.current = Math.max(-maxPanY, Math.min(maxPanY, panYRef.current))
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1
      const cw  = canvas.parentElement?.clientWidth ?? 900
      dprRef.current = dpr
      canvas.width        = cw * dpr
      canvas.height       = 560 * dpr
      canvas.style.width  = cw + 'px'
      canvas.style.height = '560px'
      sceneRef.current    = generateScene(canvas.width, canvas.height, mode)
      segCountRef.current = sceneRef.current.segmentsTotal
      colonyCountRef.current = sceneRef.current.colonyCount
      clampView()
    }

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick)
      const ctx = canvas.getContext('2d')
      if (!ctx || !sceneRef.current) return
      const t      = (now - startRef.current) / 1000
      const health = isReefHealth
        ? reefHealthVisualAtYear(valueRef.current).health
        : growthHealthAtAge(valueRef.current)
      drawFrame(ctx, sceneRef.current, t, health, mode, zoomRef.current, panXRef.current, panYRef.current, valueRef.current)
    }

    function onWheel(e: WheelEvent) {
      if (!sceneRef.current) return
      // Zoom in/out (wheel + trackpad). Clamp; adjust pan to zoom around the cursor position.
      e.preventDefault()
      const scene = sceneRef.current
      if (!scene) return

      const rect = canvas.getBoundingClientRect()
      const dpr = dprRef.current || 1
      const mx = (e.clientX - rect.left) * dpr
      const my = (e.clientY - rect.top) * dpr

      const oldZoom = zoomRef.current
      const zoomFactor = Math.exp(-e.deltaY * 0.0012)
      const nextZoom = Math.max(0.75, Math.min(2.5, oldZoom * zoomFactor))

      if (Math.abs(nextZoom - oldZoom) < 1e-4) return

      // Keep the point under the cursor stable (approx) in screen space.
      const cx = scene.w / 2
      const cy = scene.h * 0.5
      const dx = mx - cx - panXRef.current
      const dy = my - cy - panYRef.current
      const ratio = nextZoom / oldZoom
      panXRef.current = panXRef.current + dx * (1 - ratio)
      panYRef.current = panYRef.current + dy * (1 - ratio)
      zoomRef.current = nextZoom
      clampView()
    }

    let dragging = false
    let dragPointerId = -1
    let lastClientX = 0
    let lastClientY = 0

    function onPointerDown(e: PointerEvent) {
      dragging = true
      dragPointerId = e.pointerId
      lastClientX = e.clientX
      lastClientY = e.clientY
      canvas.setPointerCapture(dragPointerId)
      canvas.style.cursor = 'grabbing'
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging || e.pointerId !== dragPointerId) return
      const dpr = dprRef.current || 1
      const dx = (e.clientX - lastClientX) * dpr
      const dy = (e.clientY - lastClientY) * dpr
      lastClientX = e.clientX
      lastClientY = e.clientY
      panXRef.current += dx
      panYRef.current += dy
      clampView()
    }

    function onPointerUp(e: PointerEvent) {
      if (e.pointerId !== dragPointerId) return
      dragging = false
      dragPointerId = -1
      canvas.releasePointerCapture(e.pointerId)
      canvas.style.cursor = 'grab'
    }

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    resize()
    startRef.current = performance.now()
    rafRef.current   = requestAnimationFrame(tick)

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
    }
  }, [isReefHealth, mode])

  const healthSample = isReefHealth
    ? reefHealthVisualAtYear(selectedValue)
    : { health: growthHealthAtAge(selectedValue) }
  const health = healthSample.health

  const activeEvent = isReefHealth
    ? (GLOBAL_EVENT_YEARS.find((p) => p.year === selectedValue)?.label ?? null)
    : (
      // Reef Star Growth staging notes:
      // - Inspired by results showing rapid reef growth / functional (carbonate budget) recovery within ~4 years in a
      //   large-scale Indonesia restoration program: Lange ID et al. (2024) Current Biology.
      //   DOI: 10.1016/j.cub.2024.02.009
      selectedValue === 0 ? 'REEF STAR INSTALL'
        : selectedValue < 6 ? 'FRAGMENTS SECURED'
          : selectedValue < 12 ? 'EARLY ENCRUSTATION'
            : selectedValue < 24 ? 'BRANCHING STARTS'
              : selectedValue < 36 ? 'THICKET BUILDS'
                : selectedValue < 48 ? 'STAR ENGULFS'
                  : 'FUNCTIONAL RECOVERY'
    )
  const isWarn = isReefHealth ? health < 72 : health < 35

  const displayTitle    = title.toUpperCase()
  const displaySubtitle = (subtitle ?? (isReefHealth ? 'GLOBAL REEF HEALTH · GCRMN · NOAA CRW' : 'MARRS REEF STARS · INDONESIA')).toUpperCase()

  const safeLevel = Math.max(1, Math.min(6, titleLevel)) as 1 | 2 | 3 | 4 | 5 | 6
  const TitleTag  = `h${safeLevel}` as `h${typeof safeLevel}`
  const heroClass = `coral-reef-hero${variant === 'card' ? ' coral-reef-hero--card' : ''}`

  return (
    <section className={heroClass} aria-label={isReefHealth ? 'Reef health viewer' : 'Reef Star Growth viewer'}>

      <canvas ref={canvasRef} className="coral-reef-canvas" aria-hidden />

      <div className="crc-view-controls" aria-hidden>
        <button
          type="button"
          className="crc-view-reset"
          onClick={() => {
            zoomRef.current = 1
            panXRef.current = 0
            panYRef.current = 0
          }}
        >
          Reset view
        </button>
      </div>

      {/* ── Header — top-left ──────────────────────────────────── */}
      <div className="crc-header">
        <TitleTag className="crc-header-title">{displayTitle}</TitleTag>
        <p className="crc-header-sub">{displaySubtitle}</p>
      </div>

      {/* ── Stats — top-right ──────────────────────────────────── */}
      <aside className="crc-stats" aria-label="Reef statistics" aria-live="polite">
        <StatRow label={isReefHealth ? 'YEAR' : 'MONTH'} value={String(selectedValue)} />
        <StatRow label={isReefHealth ? 'HEALTH' : 'GROWTH'} value={`${Math.round(health)}%`} warn={isWarn} />
        {isReefHealth && selectedValue > LAST_GCRMN_COVER_YEAR && healthSample.noaaAsOfDate && (
          <StatRow label="NOAA" value={healthSample.noaaAsOfDate} />
        )}
        <StatRow label="COLONIES" value={String(colonyCountRef.current)} />
        <StatRow label="SEGMENTS" value={String(segCountRef.current)} />
        {activeEvent && <StatRow label="STATUS" value={isReefHealth ? 'BLEACHING' : 'GROWTH'} warn={isWarn} />}
      </aside>

      {/* ── Scrubber — bottom ──────────────────────────────────── */}
      <div className="crc-controls">
        <div className="crc-year-display">
          <span className="crc-year-num">{selectedValue}</span>
          {activeEvent
            ? <span className="crc-event-text">{activeEvent.toUpperCase()}</span>
            : <span className="crc-hint-text">{isReefHealth ? 'DRAG TO EXPLORE HISTORY' : 'DRAG TO SEE GROWTH'}</span>
          }
        </div>

        <div className="crc-slider-wrap">
          <input
            type="range"
            className="crc-slider"
            min={minValue}
            max={maxValue}
            step={1}
            value={selectedValue}
            onChange={e => setSelectedValue(Number(e.target.value))}
            aria-label={isReefHealth ? 'Select year to view reef health' : 'Select years since installation'}
          />
          <div className="crc-ticks" aria-hidden>
            {isReefHealth
              ? GLOBAL_EVENT_YEARS.map(p => (
                <span
                  key={p.year}
                  className={`crc-tick${p.year === selectedValue ? ' crc-tick--active' : ''}`}
                  style={{ left: `${((p.year - minValue) / span) * 100}%` }}
                />
              ))
              : STAR_TICKS.map((p) => (
                <span
                  key={p}
                  className={`crc-tick${p === selectedValue ? ' crc-tick--active' : ''}`}
                  style={{ left: `${((p - minValue) / span) * 100}%` }}
                />
              ))}
          </div>
        </div>

        <div className="crc-range-ends">
          <span>{minValue}</span>
          <span>{isReefHealth ? `TODAY (${maxValue})` : `${maxValue} mo`}</span>
        </div>
      </div>

      <span className="coral-reef-hero__sr-text">
        {isReefHealth
          ? `3D reef visualization. Use the year slider to explore changes from ${minValue} to ${maxValue}.`
          : '3D reef restoration visualization. Use the scrubber to explore growth from month 0 to month 48.'
        }
      </span>
    </section>
  )
}
