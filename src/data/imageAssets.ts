/**
 * Central config for photo URLs. Uses Unsplash CDN by default; app checks
 * for local overrides in public/images/ (e.g. /images/hero/hero.jpg).
 * Credits: see photoCredits below and optional PhotoCredit component.
 */

const UNSPLASH = 'https://images.unsplash.com'

/** Coral reef / Indonesia ocean – hero (16:9) */
export const HERO_IMAGE =
  `${UNSPLASH}/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=80`

/** Ocean / reef – login panel */
export const LOGIN_IMAGE =
  `${UNSPLASH}/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=800&q=80`

/** Research Library header */
export const LIBRARY_IMAGE =
  `${UNSPLASH}/photo-1589939704324-22df6730b2e2?auto=format&fit=crop&w=1400&q=80`

/** Sidebar subtle texture (optional) – lighter reef/ocean */
export const SIDEBAR_IMAGE =
  `${UNSPLASH}/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=440&q=60`

/** Case study images keyed by case id (4:3). Use thematic shots: wetlands, forest, mangrove. */
export const CASE_IMAGES: Record<string, { url: string; alt: string; credit?: string }> = {
  louisiana: {
    url: `${UNSPLASH}/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=800&q=80`,
    alt: 'Coastal wetlands landscape',
  },
  wildfire: {
    url: `${UNSPLASH}/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80`,
    alt: 'Forest and mountain landscape',
  },
  mangroves: {
    url: `${UNSPLASH}/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80`,
    alt: 'Mangrove and coastal water',
  },
}

export const photoCredits: { name: string; url?: string }[] = [
  { name: 'Unsplash', url: 'https://unsplash.com' },
]
