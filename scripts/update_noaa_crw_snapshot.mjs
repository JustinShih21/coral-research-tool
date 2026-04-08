#!/usr/bin/env node
/**
 * Build-time snapshot updater for NOAA Coral Reef Watch (CRW) Regional Virtual Stations stress levels.
 *
 * No dependencies: uses built-in `fetch` and simple HTML regex parsing.
 *
 * Source page (current station list + current stress levels):
 * - https://coralreefwatch.noaa.gov/product/vs/data.php
 *
 * Output (committed so the app works offline / without runtime CORS):
 * - src/data/noaaCrwSnapshot.json
 *
 * Scalar index:
 * - We compute a single 0–1 "stressIndex01" as a weighted average of the fraction of stations in each level.
 *   Weights follow the example in the spec:
 *   - No Stress: 0.00
 *   - Bleaching Watch: 0.33
 *   - Bleaching Warning: 0.66
 *   - Alert Level 1: 1.00
 *   - Alert Level 2: 1.00
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const SOURCE_URL = 'https://coralreefwatch.noaa.gov/product/vs/data.php'

function parseArgs(argv) {
  const outFlagIndex = argv.indexOf('--out')
  const out = outFlagIndex >= 0 ? argv[outFlagIndex + 1] : null
  return {
    outPath: out && !out.startsWith('--') ? out : 'src/data/noaaCrwSnapshot.json',
  }
}

const MONTHS = new Map([
  ['Jan', '01'],
  ['Feb', '02'],
  ['Mar', '03'],
  ['Apr', '04'],
  ['May', '05'],
  ['Jun', '06'],
  ['Jul', '07'],
  ['Aug', '08'],
  ['Sep', '09'],
  ['Oct', '10'],
  ['Nov', '11'],
  ['Dec', '12'],
])

function parseLatestDataDateIso(html) {
  // Example on page: "Latest Data Date: Apr. 06, 2026"
  const m = html.match(
    /Latest\s+Data\s+Date:\s*(?:<\/?[^>]+>\s*)*([A-Za-z]{3})\.?\s*(\d{1,2}),\s*(\d{4})/i
  )
  if (!m) return null
  const mon = MONTHS.get(m[1].slice(0, 3))
  if (!mon) return null
  const day = String(m[2]).padStart(2, '0')
  const year = m[3]
  return `${year}-${mon}-${day}`
}

function countStressLevels(html) {
  // Station rows are in tables with columns: Station Name | Current Stress Level | ...
  // This regex captures the stress-level text in the 2nd <td> of each <tr>.
  const rowRx =
    /<tr[^>]*>\s*<td[^>]*>[\s\S]*?<\/td>\s*<td[^>]*>\s*(?:<a[^>]*>)?\s*([^<]+?)\s*(?:<\/a>)?\s*<\/td>/gi

  const counts = { noStress: 0, watch: 0, warning: 0, alert1: 0, alert2: 0, unknown: 0 }
  let m
  // eslint-disable-next-line no-cond-assign
  while ((m = rowRx.exec(html))) {
    const raw = m[1]
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (raw === 'No Stress') counts.noStress++
    else if (raw === 'Bleaching Watch') counts.watch++
    else if (raw === 'Bleaching Warning') counts.warning++
    else if (raw === 'Alert Level 1') counts.alert1++
    else if (raw === 'Alert Level 2') counts.alert2++
    else counts.unknown++
  }

  return counts
}

function computeStressIndex01(counts) {
  const total = counts.noStress + counts.watch + counts.warning + counts.alert1 + counts.alert2 + (counts.unknown ?? 0)
  if (total <= 0) return 0
  const weighted =
    counts.noStress * 0.0 +
    counts.watch * 0.33 +
    counts.warning * 0.66 +
    (counts.alert1 + counts.alert2) * 1.0 +
    // Unknown statuses are conservatively treated as 0.
    (counts.unknown ?? 0) * 0.0
  return weighted / total
}

async function main() {
  const { outPath } = parseArgs(process.argv.slice(2))

  const res = await fetch(SOURCE_URL, {
    headers: {
      // A gentle UA helps with some CDNs; no auth or special headers required.
      'user-agent': 'reef-health-snapshot/1.0 (+https://coralreefwatch.noaa.gov)',
    },
  })
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`)
  }
  const html = await res.text()

  const asOfDate = parseLatestDataDateIso(html)
  if (!asOfDate) throw new Error('Could not parse "Latest Data Date" from NOAA page')

  const stationCountsByLevel = countStressLevels(html)
  const total =
    stationCountsByLevel.noStress +
    stationCountsByLevel.watch +
    stationCountsByLevel.warning +
    stationCountsByLevel.alert1 +
    stationCountsByLevel.alert2 +
    (stationCountsByLevel.unknown ?? 0)

  // Sanity check: NOAA page currently reports ~219 stations (with a few duplicates).
  if (total < 150) {
    throw new Error(`Parsed too few stress-level entries (${total}); page structure likely changed.`)
  }

  const stressIndex01 = computeStressIndex01(stationCountsByLevel)

  const out = {
    asOfDate,
    sourceUrl: SOURCE_URL,
    stationCountsByLevel,
    stressIndex01: Number(stressIndex01.toFixed(4)),
  }

  const absOut = path.resolve(process.cwd(), outPath)
  await fs.mkdir(path.dirname(absOut), { recursive: true })
  await fs.writeFile(absOut, JSON.stringify(out, null, 2) + '\n', 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath} (asOfDate=${asOfDate}, stations=${total}, stressIndex01=${out.stressIndex01})`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
