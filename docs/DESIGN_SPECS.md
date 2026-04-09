# Photo & layout design specs

Reference for implementing hero, login, and card imagery so placement stays consistent.

## Dashboard hero
- **Aspect ratio:** 16:9 (min-height 280px on large screens, max-height 420px)
- **Overlay:** linear gradient bottom-to-top, from transparent to `rgba(10, 30, 58, 0.75)` (--color-navy) so title stays readable
- **Text:** Instrument Serif for title, DM Sans for tagline; white with slight text-shadow

## Login
- **Layout:** Split on viewport ≥ 900px: image 45% left, form 55% right; below 900px stack (form only, solid bg) so form remains focus
- **Image:** Full-height cover; overlay on image side only `rgba(0, 0, 0, 0.35)` so card contrast is not affected
- **Form card:** Unchanged; stays on right (or centered when stacked)

## Case study cards
- **Image slot:** Optional; aspect ratio 4:3, top of card, object-fit: cover
- **Radius:** Match .case-card (var(--radius-lg)); image top corners only rounded
- **Fallback:** No placeholder image; card layout works without image

## Research Library header
- **Image:** Full-width strip, aspect 21:9, min-height 160px; dark overlay 50% for optional title overlay
- **Radius:** None for full-bleed; or bottom radius only if desired

## General
- **Photo credit:** Small .photo-credit class: 11px, var(--color-text-muted), margin-top 0.25rem
- **Reuse:** --color-primary, --color-navy, --font-serif, --radius, --shadow for all image containers
