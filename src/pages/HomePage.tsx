import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1572713629470-3e9f5d4fdf4c?auto=format&fit=crop&w=1800&q=80'

const FIELD_STORIES = [
  {
    id: 'bali',
    title: 'Bali Nursery Network',
    location: 'Bali, Indonesia',
    summary: 'Community dive teams maintain coral nurseries and monitor bleaching risk each week.',
    image: 'https://images.unsplash.com/photo-1682687982360-3f6f4e2f81cb?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'lombok',
    title: 'Women-Led Reef Stewardship',
    location: 'Lombok, Indonesia',
    summary: 'Local women-run cooperatives track nursery survival and coordinate restoration micro-grants.',
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'komodo',
    title: 'Coral Rescue Corridor',
    location: 'Komodo Corridor',
    summary: 'Fisher and tourism operators co-fund rescue outplanting after thermal stress events.',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1600&q=80',
  },
]

const RESTORATION_TRACKS = [
  {
    id: 'science',
    label: 'Science',
    title: 'Field science and monitoring',
    description: 'We support reef health diagnostics, thermal stress tracking, and post-outplant survival surveys.',
    detail: 'Every site receives repeated diver-led transects and independent validation snapshots.',
  },
  {
    id: 'finance',
    label: 'Finance',
    title: 'Finance pathways that scale',
    description: 'We design blended finance pathways that let public, philanthropic, and private capital co-fund restoration.',
    detail: 'Our team translates ecological outcomes into measurable risk and return profiles.',
  },
  {
    id: 'community',
    label: 'Community',
    title: 'Community-led operations',
    description: 'We fund local stewardship teams that can maintain nurseries year-round and respond quickly after shocks.',
    detail: 'Long-term reef recovery improves when local operators lead implementation and monitoring.',
  },
]

const REEF_OUTLOOK = [
  { year: 2026, survival: 62, jobs: 74, sites: 5 },
  { year: 2027, survival: 67, jobs: 96, sites: 7 },
  { year: 2028, survival: 71, jobs: 118, sites: 9 },
  { year: 2029, survival: 75, jobs: 143, sites: 12 },
  { year: 2030, survival: 79, jobs: 168, sites: 14 },
]

export default function HomePage() {
  const [activeStoryId, setActiveStoryId] = useState(FIELD_STORIES[0].id)
  const [activeTrackId, setActiveTrackId] = useState(RESTORATION_TRACKS[0].id)
  const [selectedYear, setSelectedYear] = useState(2028)

  const activeStory = FIELD_STORIES.find((story) => story.id === activeStoryId) ?? FIELD_STORIES[0]
  const activeTrack = RESTORATION_TRACKS.find((track) => track.id === activeTrackId) ?? RESTORATION_TRACKS[0]

  const outlook = useMemo(() => {
    return REEF_OUTLOOK.reduce((closest, row) => {
      return Math.abs(row.year - selectedYear) < Math.abs(closest.year - selectedYear) ? row : closest
    }, REEF_OUTLOOK[0])
  }, [selectedYear])

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">Coral Research Initiative</p>
          <h1>Reef restoration that communities can fund, run, and scale.</h1>
          <p>
            We help turn coral restoration into investable, community-led programs across Indonesia.
            Our model links local reef teams, scientific monitoring, and resilient financing.
          </p>
          <div className="home-hero-actions">
            <Link to="/donate" className="button-primary">Fund Restoration</Link>
            <Link to="/reef-health" className="button-secondary">Restore the Reefs</Link>
          </div>
          <div className="home-hero-metrics" role="list" aria-label="Impact snapshot">
            <article role="listitem">
              <strong>14</strong>
              <span>Active reef sites</span>
            </article>
            <article role="listitem">
              <strong>1,250+</strong>
              <span>Monthly nursery outplants</span>
            </article>
            <article role="listitem">
              <strong>168</strong>
              <span>Local livelihoods supported</span>
            </article>
          </div>
        </div>
        <figure className="home-hero-media">
          <img src={HERO_IMAGE} alt="Coral reef restoration diver" loading="eager" />
        </figure>
      </section>

      <section className="home-outlook">
        <div className="home-section-head">
          <h2>Interactive recovery outlook</h2>
          <p>Slide across years to see how survival, jobs, and active sites grow with consistent support.</p>
        </div>
        <div className="home-outlook-grid">
          <div className="home-outlook-controls">
            <label htmlFor="outlook-year">Program year: {outlook.year}</label>
            <input
              id="outlook-year"
              type="range"
              min={2026}
              max={2030}
              step={1}
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            />
            <div className="home-outlook-metrics">
              <article>
                <span>Expected survival</span>
                <strong>{outlook.survival}%</strong>
              </article>
              <article>
                <span>Community jobs</span>
                <strong>{outlook.jobs}</strong>
              </article>
              <article>
                <span>Operational reef sites</span>
                <strong>{outlook.sites}</strong>
              </article>
            </div>
          </div>
          <div className="home-outlook-visual" aria-hidden>
            <div className="home-bar-group">
              <span>Survival</span>
              <div><i style={{ width: `${outlook.survival}%` }} /></div>
            </div>
            <div className="home-bar-group">
              <span>Jobs</span>
              <div><i style={{ width: `${Math.min(100, (outlook.jobs / 170) * 100)}%` }} /></div>
            </div>
            <div className="home-bar-group">
              <span>Sites</span>
              <div><i style={{ width: `${(outlook.sites / 14) * 100}%` }} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-tracks">
        <div className="home-section-head">
          <h2>How we work</h2>
          <p>Select a pillar to explore how science, finance, and community systems connect.</p>
        </div>
        <div className="home-track-tabs" role="tablist" aria-label="Program pillars">
          {RESTORATION_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              role="tab"
              className={activeTrack.id === track.id ? 'active' : ''}
              aria-selected={activeTrack.id === track.id}
              onClick={() => setActiveTrackId(track.id)}
            >
              {track.label}
            </button>
          ))}
        </div>
        <article className="home-track-panel" role="tabpanel" aria-label={activeTrack.title}>
          <h3>{activeTrack.title}</h3>
          <p>{activeTrack.description}</p>
          <p>{activeTrack.detail}</p>
        </article>
      </section>

      <section className="home-stories">
        <div className="home-section-head">
          <h2>Field stories</h2>
          <p>Click each field site to view larger imagery and local progress updates.</p>
        </div>
        <div className="home-story-grid">
          <figure className="home-story-media">
            <img src={activeStory.image} alt={`${activeStory.title} in ${activeStory.location}`} loading="lazy" />
          </figure>
          <div className="home-story-content">
            <h3>{activeStory.title}</h3>
            <p className="home-story-location">{activeStory.location}</p>
            <p>{activeStory.summary}</p>
            <div className="home-story-list" role="list">
              {FIELD_STORIES.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  className={story.id === activeStory.id ? 'active' : ''}
                  onClick={() => setActiveStoryId(story.id)}
                  role="listitem"
                >
                  <span>{story.title}</span>
                  <span className="story-location">{story.location}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <h2>Back teams that protect reefs and livelihoods.</h2>
        <p>
          Your donation helps fund nursery operations, local steward stipends, and transparent impact reporting.
        </p>
        <Link to="/donate" className="button-primary">Go to Donation Page</Link>
      </section>
    </div>
  )
}
