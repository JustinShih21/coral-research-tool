import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

function NavGroup({ label, items }: { label: string; items: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const isAnyActive = items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      ref={ref}
      className={`site-nav-group${open ? ' open' : ''}${isAnyActive ? ' has-active' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="site-nav-group-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <svg className="site-nav-group-chevron" width="10" height="6" viewBox="0 0 10 6" aria-hidden>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="site-nav-dropdown" role="menu">
        {items.map(({ to, label: itemLabel }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `site-nav-dropdown-link${isActive ? ' active' : ''}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {itemLabel}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const workItems = [
    { to: '/coral-impact', label: 'Coral Impact' },
    { to: '/reef-health', label: 'Restore the Reefs' },
  ]

  const researchItems = [
    { to: '/library', label: 'Research Library' },
    { to: '/network', label: 'Stakeholder Network' },
  ]

  const aboutItems = [
    { to: '/team', label: 'Meet the Team' },
  ]

  const toolItems = [
    { to: '/hypotheses', label: 'Hypothesis Tracker' },
    { to: '/interview', label: 'Interview Protocol' },
    { to: '/leon-living-seas', label: 'Leon + Living Seas' },
    { to: '/team/manage', label: 'Manage team' },
  ]

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            <svg className="site-brand-logo" width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
              {/* Ocean circle background */}
              <circle cx="22" cy="22" r="22" fill="url(#logo-bg)"/>
              {/* Wave */}
              <path d="M6 28 Q10 24 14 28 Q18 32 22 28 Q26 24 30 28 Q34 32 38 28" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              {/* Coral branch left */}
              <path d="M14 32 L14 22" stroke="#ff9eb5" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 26 L11 23" stroke="#ff9eb5" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M14 24 L17 21" stroke="#ff9eb5" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="14" cy="22" r="1.4" fill="#ff7ba8"/>
              <circle cx="11" cy="23" r="1.2" fill="#ff7ba8"/>
              <circle cx="17" cy="21" r="1.2" fill="#ff7ba8"/>
              {/* Coral branch center */}
              <path d="M22 33 L22 20" stroke="#00d4b8" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M22 28 L19 25" stroke="#00d4b8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M22 25 L25 22" stroke="#00d4b8" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="22" cy="20" r="1.6" fill="#00bfa8"/>
              <circle cx="19" cy="25" r="1.2" fill="#00bfa8"/>
              <circle cx="25" cy="22" r="1.2" fill="#00bfa8"/>
              {/* Coral branch right */}
              <path d="M30 32 L30 23" stroke="#ffc87a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M30 27 L27 24" stroke="#ffc87a" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M30 25 L33 22" stroke="#ffc87a" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="30" cy="23" r="1.4" fill="#ffb450"/>
              <circle cx="27" cy="24" r="1.2" fill="#ffb450"/>
              <circle cx="33" cy="22" r="1.2" fill="#ffb450"/>
              <defs>
                <radialGradient id="logo-bg" cx="40%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="#0e4a8a"/>
                  <stop offset="100%" stopColor="#061a3a"/>
                </radialGradient>
              </defs>
            </svg>
            <span className="site-brand-text">
              <strong>Restore The Reefs</strong>
              <span>Coral Reef Conservation</span>
            </span>
          </Link>
          <button
            type="button"
            className="site-menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-nav-panel"
          >
            Menu
          </button>
          <div id="site-nav-panel" className={`site-nav-panel${menuOpen ? ' open' : ''}`}>
            <nav className="site-nav" aria-label="Main">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}
              >
                Home
              </NavLink>
              <NavGroup label="Our Work" items={workItems} />
              <NavGroup label="Research" items={researchItems} />
              <NavGroup label="About" items={aboutItems} />
              {user && <NavGroup label="Tools" items={toolItems} />}
            </nav>
            <div className="site-nav-right">
              <Link to="/donate" className="site-donate-cta">Donate</Link>
              <div className="site-auth">
                {!loading && (
                  user ? (
                    <>
                      <span className="site-auth-user">{user.user_metadata?.full_name || user.email}</span>
                      <button type="button" className="site-auth-button" onClick={() => signOut()}>
                        Log out
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="site-auth-link">Team log in</Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="main site-main">
        {children ?? <Outlet />}
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Restore The Reefs · Building bankable pathways for reef restoration.</p>
          <Link to="/donate" className="site-footer-donate">Support Restoration</Link>
        </div>
      </footer>
    </div>
  )
}
