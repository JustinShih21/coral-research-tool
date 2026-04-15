import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  CoralPage,
  bindCoralScrollDepthTracking,
  trackCoralDonateClick,
  trackCoralDonateComplete,
  trackCoralPageView,
} from '@/lib/coralAnalytics'

type CoralImpactShellProps = {
  page: CoralPage
  showMobileDonate?: boolean
  children: ReactNode
}

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'coral-impact-theme'

const PAGE_LINKS: Array<{ to: string; label: string; page: CoralPage }> = [
  { to: '/coral-impact', label: 'Hub', page: 'hub' },
  { to: '/economy', label: 'Economy', page: 'economy' },
  { to: '/marine-life', label: 'Marine Life', page: 'marine' },
  { to: '/planet', label: 'Planet', page: 'climate' },
]

function getPreferredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function CoralImpactShell({ page, showMobileDonate = false, children }: CoralImpactShellProps) {
  const location = useLocation()
  const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme())
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    trackCoralPageView(page)
    const unbind = bindCoralScrollDepthTracking(page)
    return () => unbind()
  }, [page])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('donation') === 'complete') {
      trackCoralDonateComplete(page)
    }
  }, [location.search, page])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const donateHref = useMemo(() => `/donate?source=coral-${page}-nav`, [page])
  const mobileDonateHref = useMemo(() => `/donate?source=coral-${page}-mobile`, [page])

  return (
    <div className="ci-shell" data-theme={theme}>
      <a href="#ci-main-content" className="ci-skip-link">Skip to content</a>

      <header className={`ci-nav ${scrolled ? 'is-solid' : ''}`}>
        <div className="ci-nav-inner">
          <div className="ci-nav-brand-group">
            <Link to="/" className="ci-back-link" aria-label="Back to main site">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Main site
            </Link>
            <Link to="/coral-impact" className="ci-brand">
              <span className="ci-brand-mark" aria-hidden />
              <span className="ci-brand-wordmark">Coral Impact</span>
            </Link>
          </div>

          <nav className="ci-nav-links" aria-label="Coral impact pages">
            {PAGE_LINKS.map((entry) => (
              <NavLink
                key={entry.to}
                to={entry.to}
                className={({ isActive }) => `ci-nav-link${isActive ? ' active' : ''}`}
              >
                {entry.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to={donateHref}
            className="ci-button ci-button--coral ci-nav-donate"
            onClick={() => trackCoralDonateClick(page, 'nav')}
          >
            Donate
          </Link>
        </div>
      </header>

      <main id="ci-main-content" className="ci-main-content">
        {children}
      </main>

      <footer className="ci-footer">
        <div className="ci-footer-inner">
          <div className="ci-footer-links" aria-label="Explore more pages">
            {PAGE_LINKS.filter((entry) => entry.page !== page).map((entry) => (
              <Link key={entry.to} to={entry.to} className="ci-link-inline">
                {entry.label}
              </Link>
            ))}
          </div>
          <div className="ci-footer-actions">
            <button
              type="button"
              className="ci-theme-toggle"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            </button>
          </div>
        </div>
      </footer>

      {showMobileDonate && (
        <div className="ci-mobile-donate">
          <Link
            to={mobileDonateHref}
            className="ci-button ci-button--coral"
            onClick={() => trackCoralDonateClick(page, 'mobile_fixed')}
          >
            Donate to Protect Reefs
          </Link>
        </div>
      )}
    </div>
  )
}
