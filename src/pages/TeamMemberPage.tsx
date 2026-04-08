import { Link, useParams } from 'react-router-dom'
import { useTeamSiteData } from '@/hooks/useTeamSiteData'

function Avatar({ name, photoUrl }: { name: string; photoUrl: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  if (photoUrl.trim()) {
    return <img className="team-profile-photo" src={photoUrl.trim()} alt="" />
  }
  return <span className="team-profile-photo-fallback">{initials || '?'}</span>
}

export default function TeamMemberPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, loading } = useTeamSiteData()

  if (loading || !data) {
    return (
      <div className="team-page">
        <p className="team-loading">Loading…</p>
      </div>
    )
  }

  const member = data.currentMembers.find((m) => m.slug === slug)

  if (!member) {
    return (
      <div className="team-page">
        <div className="team-panel team-member-missing">
          <h1>Member not found</h1>
          <p className="team-muted">This profile does not exist or is no longer on the current team page.</p>
          <Link to="/team" className="team-back-link">
            ← Back to team
          </Link>
        </div>
      </div>
    )
  }

  const linkedIn = member.linkedInUrl?.trim()

  return (
    <div className="team-page team-member-page">
      <p className="team-public-note team-public-note-tight">
        Public profile — share this page with anyone; no account is required to view it.
      </p>
      <nav className="team-breadcrumb" aria-label="Breadcrumb">
        <Link to="/team">Meet the team</Link>
        <span aria-hidden> / </span>
        <span>{member.name}</span>
      </nav>

      <header className="team-profile-header">
        <div className="team-profile-avatar-wrap">
          <Avatar name={member.name} photoUrl={member.photoUrl} />
        </div>
        <div>
          <h1>{member.name}</h1>
          {member.headline && <p className="team-profile-headline">{member.headline}</p>}
          {member.role && <p className="team-profile-role">{member.role}</p>}
          {linkedIn && (
            <a
              className="team-linkedin-btn"
              href={linkedIn.startsWith('http') ? linkedIn : `https://${linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn profile
            </a>
          )}
        </div>
      </header>

      {member.bio?.trim() && (
        <section className="team-panel">
          <h2>About</h2>
          <p className="team-prose">{member.bio.trim()}</p>
        </section>
      )}

      {member.experience.length > 0 && (
        <section className="team-panel">
          <h2>Experience</h2>
          <ul className="team-profile-list">
            {member.experience.map((ex, i) => (
              <li key={`${ex.title}-${i}`}>
                <strong>{ex.title}</strong>
                {ex.org && <span className="team-profile-org"> · {ex.org}</span>}
                {(ex.start || ex.end) && (
                  <span className="team-profile-dates">
                    {' '}
                    ({[ex.start, ex.end].filter(Boolean).join(' – ')})
                  </span>
                )}
                {ex.description?.trim() && <p className="team-profile-desc">{ex.description.trim()}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {member.education.length > 0 && (
        <section className="team-panel">
          <h2>Education</h2>
          <ul className="team-profile-list">
            {member.education.map((ed, i) => (
              <li key={`${ed.school}-${i}`}>
                <strong>{ed.school}</strong>
                {ed.degree && <span> — {ed.degree}</span>}
                {ed.year && <span className="team-profile-dates"> ({ed.year})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {member.skills.length > 0 && (
        <section className="team-panel">
          <h2>Skills</h2>
          <ul className="team-skills">
            {member.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="team-back-wrap">
        <Link to="/team" className="team-back-link">
          ← Back to full team
        </Link>
      </p>
    </div>
  )
}
