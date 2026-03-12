import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface TeamOnlyGateProps {
  /** After login, redirect here (e.g. current path) */
  returnUrl?: string
}

export default function TeamOnlyGate({ returnUrl }: TeamOnlyGateProps) {
  const loginHref = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/login'

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Team access</h1>
        <p className="login-muted">
          This section is for team members. Log in to view and edit research data, add documents, and use field tools.
        </p>
        <div className="team-gate-actions">
          <Link to={loginHref} className="team-gate-btn">
            Log in for team access
          </Link>
        </div>
        <p className="login-back-home">
          <Link to="/">← Back to app</Link>
        </p>
      </div>
    </div>
  )
}

/** Renders children when user is logged in; otherwise renders TeamOnlyGate with current path as returnUrl. */
export function TeamOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <TeamOnlyGate returnUrl={location.pathname} />
  return <>{children}</>
}
