import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const publicNav = [
    { to: '/', label: 'Home' },
    { to: '/reef-health', label: 'Reef Health' },
    { to: '/team', label: 'Meet the team' },
    { to: '/donate', label: 'Donate' },
    { to: '/library', label: 'Research Library' },
    { to: '/network', label: 'Stakeholder Network' },
  ]

  const fullNav = [
    { to: '/', label: 'Home' },
    { to: '/reef-health', label: 'Reef Health' },
    { to: '/team', label: 'Meet the team' },
    { to: '/donate', label: 'Donate' },
    { to: '/library', label: 'Research Library' },
    { to: '/network', label: 'Stakeholder Network' },
    { to: '/hypotheses', label: 'Hypothesis Tracker' },
    { to: '/interview', label: 'Interview Protocol' },
    { to: '/leon-living-seas', label: 'Leon + Living Seas' },
    { to: '/team/manage', label: 'Manage team' },
  ]

  const navItems = user ? fullNav : publicNav

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            <span className="site-brand-mark" aria-hidden />
            <span className="site-brand-text">
              <strong>Coral Research Initiative</strong>
              <span>Restoration Finance & Field Action</span>
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
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => {
                    const active = isActive ? ' active' : ''
                    const donate = to === '/donate' ? ' donate' : ''
                    return `site-nav-link${active}${donate}`
                  }}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
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
      </header>
      <main className="main site-main">
        {children ?? <Outlet />}
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Coral Research Initiative · Building bankable pathways for reef restoration.</p>
          <Link to="/donate" className="site-footer-donate">Support Restoration</Link>
        </div>
      </footer>
    </div>
  )
}
