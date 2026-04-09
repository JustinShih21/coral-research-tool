import CoralImpactShell from '@/components/coral-impact/CoralImpactShell'
import DonateConversionBlock from '@/components/coral-impact/DonateConversionBlock'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1682687982360-3f6f4e2f81cb?auto=format&fit=crop&w=1800&q=80'

const STAT_BAR = [
  { value: '25%', label: 'Of marine species depend on reefs' },
  { value: '<1%', label: 'Of ocean floor covered by reefs' },
  { value: '4,000+', label: 'Fish species associated with reefs' },
] as const

const SPECIES_SPOTLIGHTS = [
  {
    name: 'Clownfish',
    dependency: 'Depends on reef anemone habitats for protection and breeding.',
    status: 'Habitat pressure rising',
    image: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hawksbill Turtle',
    dependency: 'Feeds in reef systems and relies on healthy reef food webs.',
    status: 'Critically endangered',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Manta Ray',
    dependency: 'Uses reef cleaning stations for parasite removal and health.',
    status: 'Vulnerable',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Parrotfish',
    dependency: 'Controls algae and helps maintain reef growth conditions.',
    status: 'Keystone grazer',
    image: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=1200&q=80',
  },
] as const

const CASCADE_STEPS = [
  'Thermal bleaching weakens coral tissue and color',
  'Algae overgrowth crowds coral skeletons',
  'Herbivores decline as habitat complexity drops',
  'Reef structure collapses and nursery habitat shrinks',
  'Pelagic fish recruitment and apex predators decline',
] as const

const RECOVERY_METRICS = [
  { label: 'Fish biomass', value: 68 },
  { label: 'Live coral cover', value: 54 },
  { label: 'Species richness', value: 61 },
] as const

export default function CoralImpactMarineLifePage() {
  return (
    <CoralImpactShell page="marine" showMobileDonate>
      <section
        className="ci-hero"
        style={{ backgroundImage: `linear-gradient(125deg, rgba(4, 30, 48, 0.76), rgba(4, 30, 48, 0.34)), url(${HERO_IMAGE})` }}
      >
        <div className="ci-hero-content">
          <p className="ci-kicker">Coral Reefs & Marine Life</p>
          <h1>One in four ocean species calls a coral reef home.</h1>
          <p>
            Coral collapse is not a single-species problem. It triggers chain reactions across food webs,
            nursery habitats, and migration pathways.
          </p>
        </div>
      </section>

      <section className="ci-section ci-stat-bar" aria-label="Marine reef statistics">
        {STAT_BAR.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="ci-section">
        <h2>Species spotlights</h2>
        <div className="ci-species-grid">
          {SPECIES_SPOTLIGHTS.map((species) => (
            <article key={species.name} className="ci-species-card">
              <img src={species.image} alt={species.name} loading="lazy" />
              <div>
                <h3>{species.name}</h3>
                <p>{species.dependency}</p>
                <span>{species.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ci-section ci-cascade">
        <h2>Ecosystem cascade</h2>
        <div className="ci-cascade-steps" role="list" aria-label="Coral collapse cascade">
          {CASCADE_STEPS.map((step) => (
            <article role="listitem" key={step}>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ci-section ci-before-after">
        <article>
          <h2>Before restoration</h2>
          <p>Low structural complexity, high algae cover, low juvenile fish density.</p>
        </article>
        <article>
          <h2>After restoration</h2>
          <p>Reef frameworks return, fish schools repopulate, and coral recruitment rises.</p>
        </article>
      </section>

      <section className="ci-section ci-recovery-data">
        <h2>Recovery indicators on restored reefs</h2>
        <div>
          {RECOVERY_METRICS.map((metric) => (
            <article key={metric.label}>
              <div className="ci-recovery-top">
                <span>{metric.label}</span>
                <strong>{metric.value}%</strong>
              </div>
              <div className="ci-recovery-track" aria-hidden>
                <i style={{ width: `${metric.value}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="marine" placement="mid" />
      </section>

      <section className="ci-section ci-story">
        <h2>Human moment</h2>
        <blockquote>
          "At our restoration sites, fish returned first. When structure came back, everything else followed."
        </blockquote>
        <p>Field reflection from a reef monitoring dive team.</p>
      </section>

      <section className="ci-section ci-stakes" aria-label="What is at stake">
        <h2>What&apos;s at stake</h2>
        <div>
          <article>
            <h3>Biodiversity loss</h3>
            <p>Habitat specialists disappear first, then food-web resilience weakens.</p>
          </article>
          <article>
            <h3>Food chain instability</h3>
            <p>Nursery habitat decline reduces fish recruitment and regional biomass.</p>
          </article>
          <article>
            <h3>Ecological irreversibility</h3>
            <p>Recovery windows close quickly as repeated bleaching compounds stress.</p>
          </article>
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="marine" placement="bottom" />
      </section>
    </CoralImpactShell>
  )
}
