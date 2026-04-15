import { Link } from 'react-router-dom'
import { useTeamSiteData } from '@/hooks/useTeamSiteData'

function Avatar({ name, photoUrl }: { name: string; photoUrl: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  if (photoUrl.trim()) {
    return <img className="team-avatar-img" src={photoUrl.trim()} alt="" />
  }
  return (
    <span className="team-avatar-fallback" aria-hidden>
      {initials || '?'}
    </span>
  )
}

export default function TeamPage() {
  const { data, loading } = useTeamSiteData()

  if (loading || !data) {
    return (
      <div className="team-page">
        <p className="team-loading">Loading…</p>
      </div>
    )
  }

  const { teamOverview, currentMembers, pastCohorts } = data

  return (
    <div className="team-page">
      <header className="team-hero">
        <p className="team-kicker">Restore The Reefs</p>
        <h1>{teamOverview.title}</h1>
        {teamOverview.subtitle && <p className="team-hero-sub">{teamOverview.subtitle}</p>}
        <p className="team-public-note">
          These pages are public—no log-in needed. Jump to a section or open anyone’s full profile below.
        </p>
      </header>

      <nav className="team-section-nav" aria-label="On this page">
        <a href="#team-section-who">Who we are</a>
        <a href="#team-section-goals">Goals</a>
        <a href="#team-section-story">How we joined</a>
        <a href="#team-section-current">Current team</a>
        {pastCohorts.length > 0 && <a href="#team-section-past">Past teams</a>}
      </nav>

      <section id="team-section-who" className="team-panel">
        <h2>Who we are</h2>
        {teamOverview.missionParagraphs.map((p, i) => (
          <p key={`mission-${i}`} className="team-prose">
            {p}
          </p>
        ))}
      </section>

      <section id="team-section-goals" className="team-panel">
        <h2>Goals</h2>
        <ul className="team-goals">
          {teamOverview.goals.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </section>

      <section id="team-section-story" className="team-panel">
        <h2>How we came together</h2>
        <p className="team-prose team-origin">{teamOverview.originStory}</p>
      </section>

      <section id="team-section-current" className="team-panel">
        <h2>Current team</h2>
        {currentMembers.length === 0 ? (
          <p className="team-muted">Team profiles will appear here as they are published.</p>
        ) : (
          <>
            <p className="team-current-intro">
              Each card links to a <strong>full profile page</strong> on this site (experience, education, bio, and
              LinkedIn). You can also use the list of direct links right under the grid.
            </p>
            <div className="team-current-grid">
              {currentMembers.map((m) => (
                <Link key={m.id} to={`/team/member/${m.slug}`} className="team-member-card">
                  <div className="team-avatar">
                    <Avatar name={m.name} photoUrl={m.photoUrl} />
                  </div>
                  <strong>{m.name}</strong>
                  {(m.role || m.headline) && (
                    <span className="team-member-card-meta">{m.role || m.headline}</span>
                  )}
                  <span className="team-member-card-cta">View full profile →</span>
                </Link>
              ))}
            </div>
            <nav className="team-profile-directory" aria-label="Direct links to member profiles">
              <h3 className="team-profile-directory-title">Profile pages</h3>
              <ul>
                {currentMembers.map((m) => (
                  <li key={m.id}>
                    <Link to={`/team/member/${m.slug}`}>{m.name}</Link>
                    {(m.role || m.headline) && (
                      <span className="team-profile-directory-meta"> — {m.role || m.headline}</span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </>
        )}
      </section>

      {pastCohorts.length > 0 && (
        <section id="team-section-past" className="team-panel">
          <h2>Past teams</h2>
          {pastCohorts.map((cohort) => (
            <div key={cohort.id} className="team-past-cohort">
              <h3>{cohort.label}</h3>
              <div className="team-past-grid">
                {cohort.members.map((m) => {
                  const href = (m.linkedInUrl ?? '').trim()
                  const inner = (
                    <>
                      <div className="team-avatar team-avatar-sm">
                        <Avatar name={m.name} photoUrl={m.photoUrl} />
                      </div>
                      <span className="team-past-name">{m.name}</span>
                    </>
                  )
                  return href ? (
                    <a
                      key={`${cohort.id}-${m.name}`}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-past-card"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={`${cohort.id}-${m.name}`} className="team-past-card team-past-card-static">
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
