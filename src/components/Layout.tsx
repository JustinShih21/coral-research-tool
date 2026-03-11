import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'

export default function Layout({ children }: { children?: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowBackToTop(el.scrollTop > 400)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/network', label: 'Stakeholder Network' },
    { to: '/contacts', label: 'Contacts' },
    { to: '/funding', label: 'Funding Flows' },
    { to: '/hypotheses', label: 'Hypothesis Tracker' },
    { to: '/interview', label: 'Interview Protocol' },
    { to: '/cases', label: 'Case Studies' },
    { to: '/bottlenecks', label: 'Bottleneck Diagnostic' },
    { to: '/library', label: 'Research Library' },
  ]
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">Coral Research</h1>
        <nav className="nav">
          {nav.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main ref={mainRef} className="main">
        {children ?? <Outlet />}
      </main>
      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  )
}
