import { Link } from 'react-router-dom'
import CoralImpactShell from '@/components/coral-impact/CoralImpactShell'
import DonateConversionBlock from '@/components/coral-impact/DonateConversionBlock'

const HUB_HERO_IMAGE =
  'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1800&q=80'

const PILLAR_CARDS = [
  {
    id: 'economy',
    title: 'Coral Reefs & the Economy',
    description: 'Reefs underpin tourism, fisheries, and coastal protection worth billions every year.',
    href: '/economy',
    image:
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'marine',
    title: 'Coral Reefs & Marine Life',
    description: 'A quarter of all marine species rely on reefs for food, shelter, and reproduction.',
    href: '/marine-life',
    image:
      'https://images.unsplash.com/photo-1572713629470-3e9f5d4fdf4c?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'climate',
    title: 'Coral Reefs & Planet Stability',
    description: 'Reefs buffer coastlines and support ocean systems that keep communities resilient.',
    href: '/planet',
    image:
      'https://images.unsplash.com/photo-1682687982360-3f6f4e2f81cb?auto=format&fit=crop&w=1400&q=80',
  },
] as const

export default function CoralImpactHubPage() {
  return (
    <CoralImpactShell page="hub">
      <section
        className="ci-hero ci-hero--hub"
        style={{ backgroundImage: `linear-gradient(125deg, rgba(3, 25, 40, 0.78), rgba(3, 25, 40, 0.42)), url(${HUB_HERO_IMAGE})` }}
      >
        <div className="ci-hero-content">
          <p className="ci-kicker">Coral Impact</p>
          <h1>
            Coral reefs cover less than 1% of the ocean floor. They support 25% of marine life.
            They are disappearing.
          </h1>
          <p>
            This hub connects the economy, biodiversity, and climate stakes of coral collapse and shows why
            immediate restoration funding matters.
          </p>
          <a href="#ci-pillars" className="ci-button ci-button--ghost">Explore the three pillars</a>
        </div>
      </section>

      <section className="ci-section ci-overview">
        <h2>Why this matters now</h2>
        <p>
          Coral reefs are not just ecological assets. They are living infrastructure for fisheries, storm protection,
          marine biodiversity, and coastal economies. The next decade determines whether restoration can still preserve
          functional reef systems.
        </p>
      </section>

      <section id="ci-pillars" className="ci-section ci-card-grid" aria-label="Coral impact pillars">
        {PILLAR_CARDS.map((card) => (
          <article className="ci-pill-card" key={card.id}>
            <figure className="ci-pill-card-media">
              <img src={card.image} alt={card.title} loading="lazy" />
            </figure>
            <div className="ci-pill-card-body">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <Link to={card.href} className="ci-link-inline">Read this pillar</Link>
            </div>
          </article>
        ))}
      </section>

      <div className="ci-section">
        <DonateConversionBlock page="hub" placement="bottom" />
      </div>
    </CoralImpactShell>
  )
}
