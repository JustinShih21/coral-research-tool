/**
 * Global reef health timeline (monitored era only).
 *
 * Sources (citations kept in code comments only, per requirements):
 * - GCRMN (Global Coral Reef Monitoring Network) — Status of Coral Reefs of the World: 2020 report (global hard coral cover).
 *   PDF: https://gcrmn.net/wp-content/uploads/2025/08/GCRMN_Status_of_Coral_Reefs_of_the_World_2020.pdf
 *   See Chapter 2 "Status of coral reefs of the World", section 2.1.1 "Global analysis":
 *   - "Between 1978 and 1997, global average hard coral cover remained stable between 32.1% and 32.5%."
 *   - "Between 1997 and 2002, global average hard coral cover declined from 32.5% to 30%."
 *   - "... returned to 33.3% in 2009 ..."
 *   - "... declined to 28.8% in 2018 ..." and "In 2019, global average hard coral cover increased by 0.7% ..."
 * - NOAA Coral Reef Watch — Current Global Bleaching: Status Update (4th global bleaching event; updated 2025).
 *   https://coralreefwatch.noaa.gov/satellite/analyses_guidance/global_bleaching_status.php
 * - NOAA Coral Reef Watch — 5 km Regional Virtual Stations (Satellite Bleaching Alert / stress levels; used for 2026 "TODAY").
 *   https://coralreefwatch.noaa.gov/product/vs/data.php
 *
 * Notes on meaning:
 * - For years within the GCRMN global hard-coral-cover series, we convert hard coral cover (%) into a 0–100
 *   visualization "HEALTH" index using a fixed linear mapping (documented below). This is a UI index, not a
 *   clinical/ecological definition of health.
 * - There is no published global-average hard coral cover for 2026. For 2020→2026 we blend toward a NOAA CRW
 *   stress-derived index (from the committed `noaaCrwSnapshot.json`) so the slider continues to change through TODAY.
 */

import noaaSnapshot from './noaaCrwSnapshot.json'

export const FIRST_YEAR = 1978
export const LAST_YEAR = 2026 // TODAY (Apr 8, 2026)

// Last year with global-average hard coral cover in the GCRMN 2020 synthesis.
export const LAST_GCRMN_COVER_YEAR = 2019

export type CoverPoint = {
  year: number
  /**
   * Global average hard coral cover (% of benthos).
   * Values are anchored to explicit statements in the GCRMN 2020 report text (not eyeballed from charts).
   */
  coverPercent: number
}

export const TIMELINE_COVER_POINTS: CoverPoint[] = [
  // GCRMN states global hard coral cover was stable between 32.1% and 32.5% from 1978–1997.
  { year: 1978, coverPercent: 32.1 },
  { year: 1997, coverPercent: 32.5 },
  // GCRMN states a decline from 32.5% (1997) to 30% (2002).
  { year: 2002, coverPercent: 30.0 },
  // GCRMN states global cover returned to 33.3% in 2009.
  { year: 2009, coverPercent: 33.3 },
  // GCRMN states global cover declined to 28.8% in 2018.
  { year: 2018, coverPercent: 28.8 },
  // GCRMN states global cover increased by 0.7% in 2019; interpreted here as +0.7 percentage points.
  { year: 2019, coverPercent: 29.5 },
]

export type ReefEventYear = { year: number; label: string }

export const EVENT_YEARS: ReefEventYear[] = [
  // NOAA CRW global bleaching events (1998, 2010, 2014–2017, and the ongoing 4th event from 2023 onward).
  { year: 1998, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2010, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2014, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2015, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2016, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2017, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2024, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2025, label: 'GLOBAL BLEACHING EVENT' },
  { year: 2026, label: 'HEAT STRESS ALERTS' },
]

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * Interpolates the GCRMN-anchored cover curve for any year within [FIRST_YEAR, LAST_GCRMN_COVER_YEAR].
 * This uses a smooth interpolation between the anchor points above.
 */
export function coverPercentAtYear(year: number): number {
  const y = clamp(year, FIRST_YEAR, LAST_GCRMN_COVER_YEAR)
  const points = TIMELINE_COVER_POINTS
  let lo = points[0]
  let hi = points[points.length - 1]
  for (let i = 0; i < points.length - 1; i++) {
    if (y >= points[i].year && y <= points[i + 1].year) {
      lo = points[i]
      hi = points[i + 1]
      break
    }
  }
  const span = hi.year - lo.year
  const t = span === 0 ? 0 : (y - lo.year) / span
  return lerp(lo.coverPercent, hi.coverPercent, easeInOutCubic(t))
}

/**
 * Maps coral cover (%) → a 0–100 UI index.
 *
 * We intentionally amplify changes within the observed global range so the visualization is legible.
 * Mapping choice (documented, but not shown in UI):
 * - 33.3% cover (GCRMN 2009 global value) → 100 "HEALTH"
 * - 28.8% cover (GCRMN 2018 global value) → 70  "HEALTH"
 * Values outside that range are clamped.
 */
export function healthFromCoverPercent(coverPercent: number): number {
  const coverMin = 28.8
  const coverMax = 33.3
  const t = (clamp(coverPercent, coverMin, coverMax) - coverMin) / (coverMax - coverMin)
  return 70 + t * 30
}

export type ReefHealthSample = {
  year: number
  /** 0–100 visualization index used by the renderer. */
  health: number
  /** Present for years <= LAST_GCRMN_COVER_YEAR. */
  coverPercent?: number
  /** Present for years > LAST_GCRMN_COVER_YEAR (blended). */
  noaaStressIndex01?: number
  /** Present for years > LAST_GCRMN_COVER_YEAR. */
  noaaAsOfDate?: string
}

/**
 * Returns the reef-health value used by the visualization for a given year.
 */
export function reefHealthAtYear(year: number): ReefHealthSample {
  const y = clamp(year, FIRST_YEAR, LAST_YEAR)

  if (y <= LAST_GCRMN_COVER_YEAR) {
    const cover = coverPercentAtYear(y)
    return { year: y, health: healthFromCoverPercent(cover), coverPercent: cover }
  }

  const cover2019 = coverPercentAtYear(LAST_GCRMN_COVER_YEAR)
  const coverHealth = healthFromCoverPercent(cover2019)
  const stressHealth = 100 * (1 - clamp(noaaSnapshot.stressIndex01, 0, 1))

  const tRaw = (y - LAST_GCRMN_COVER_YEAR) / (LAST_YEAR - LAST_GCRMN_COVER_YEAR)
  const t = easeInOutCubic(clamp(tRaw, 0, 1))

  return {
    year: y,
    health: lerp(coverHealth, stressHealth, t),
    noaaStressIndex01: noaaSnapshot.stressIndex01,
    noaaAsOfDate: noaaSnapshot.asOfDate,
  }
}
