import { Outlet, NavLink } from 'react-router-dom'

export default function Layout({ children }: { children?: React.ReactNode }) {
  const nav = [
    { to: '/', label: 'Dashboard' },
    { to: '/network', label: 'Stakeholder Network' },
    { to: '/funding', label: 'Funding Flows' },
    { to: '/hypotheses', label: 'Hypothesis Tracker' },
    { to: '/interview', label: 'Interview Protocol' },
    { to: '/cases', label: 'Case Studies' },
    { to: '/bottlenecks', label: 'Bottleneck Diagnostic' },
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
      <main className="main">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
