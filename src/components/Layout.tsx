import { useState, useEffect, useRef, Fragment } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Layout({ children }: { children?: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const { user, loading, signOut } = useAuth()

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

  const publicNav = [
    { to: '/', label: 'Dashboard' },
    { to: '/cases', label: 'Case Studies' },
    { to: '/library', label: 'Research Library' },
    { to: '/contacts', label: 'Contacts' },
    { to: '/funding', label: 'Funding Flows' },
    { to: '/network', label: 'Stakeholder Network' },
  ]

  const fullNav = [
    { to: '/', label: 'Dashboard' },
    { to: '/cases', label: 'Case Studies' },
    { to: '/library', label: 'Research Library' },
    { to: '/contacts', label: 'Contacts' },
    { to: '/funding', label: 'Funding Flows' },
    { to: '/network', label: 'Stakeholder Network' },
    { to: '/hypotheses', label: 'Hypothesis Tracker' },
    { to: '/interview', label: 'Interview Protocol' },
    { to: '/bottlenecks', label: 'Bottleneck Diagnostic' },
    { to: '/leon-living-seas', label: 'Leon + Living Seas' },
  ]

  const navItems = user ? fullNav : publicNav
  const teamOnlyStartIndex = 6

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="sidebar-title">Coral Research</h1>
        <nav className="nav">
          {navItems.map(({ to, label }, i) => (
            <Fragment key={to}>
              {user && i === teamOnlyStartIndex && (
                <span className="nav-team-label">Team tools</span>
              )}
              <NavLink to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                {label}
              </NavLink>
            </Fragment>
          ))}
        </nav>
      </aside>
      <main ref={mainRef} className="main">
        <div className="main-header">
          <span />
          <div className="auth-bar">
            {!loading && (
              user ? (
                <>
                  <span className="auth-user">{user.user_metadata?.full_name || user.email}</span>
                  <button type="button" className="auth-logout" onClick={() => signOut()}>
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/login" className="auth-login">Log in</Link>
              )
            )}
          </div>
        </div>
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
