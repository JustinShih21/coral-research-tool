export type CoralPage = 'hub' | 'economy' | 'marine' | 'climate'
export type CoralDepth = 25 | 50 | 75 | 100

const DEPTH_MILESTONES: CoralDepth[] = [25, 50, 75, 100]

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void
  }
}

function emitCoralEvent(eventName: string, props: Record<string, unknown>) {
  if (typeof window === 'undefined') return

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...props,
    })
  }

  if (typeof window.plausible === 'function') {
    window.plausible(eventName, { props })
  }
}

export function trackCoralPageView(page: CoralPage) {
  emitCoralEvent(`coral_${page}_view`, { page })
}

export function trackCoralScrollDepth(page: CoralPage, depth: CoralDepth) {
  emitCoralEvent(`coral_${page}_scroll_${depth}`, { page, depth })
}

export function trackCoralDonateClick(page: CoralPage, placement: string) {
  emitCoralEvent(`coral_${page}_donate_click`, { page, placement })
}

export function trackCoralDonateComplete(page: CoralPage) {
  emitCoralEvent(`coral_${page}_donate_complete`, { page })
}

export function bindCoralScrollDepthTracking(page: CoralPage): () => void {
  if (typeof window === 'undefined') return () => undefined

  const fired = new Set<CoralDepth>()

  const maybeEmitDepths = () => {
    const doc = document.documentElement
    const maxScroll = Math.max(doc.scrollHeight - doc.clientHeight, 0)

    if (maxScroll <= 0) {
      DEPTH_MILESTONES.forEach((depth) => {
        if (!fired.has(depth)) {
          fired.add(depth)
          trackCoralScrollDepth(page, depth)
        }
      })
      return
    }

    const progress = (window.scrollY / maxScroll) * 100

    DEPTH_MILESTONES.forEach((depth) => {
      if (progress >= depth && !fired.has(depth)) {
        fired.add(depth)
        trackCoralScrollDepth(page, depth)
      }
    })
  }

  maybeEmitDepths()
  window.addEventListener('scroll', maybeEmitDepths, { passive: true })
  window.addEventListener('resize', maybeEmitDepths)

  return () => {
    window.removeEventListener('scroll', maybeEmitDepths)
    window.removeEventListener('resize', maybeEmitDepths)
  }
}
