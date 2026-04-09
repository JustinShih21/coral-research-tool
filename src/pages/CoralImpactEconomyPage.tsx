import CoralImpactShell from '@/components/coral-impact/CoralImpactShell'
import DonateConversionBlock from '@/components/coral-impact/DonateConversionBlock'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1800&q=80'

const STAT_BAR = [
  { value: '$2.7T', label: 'Upper-bound global annual reef value' },
  { value: '500M+', label: 'People relying on reef fisheries and livelihoods' },
  { value: '97%', label: 'Wave energy reduction from intact reefs' },
] as const

const IMPACT_ROWS = [
  {
    category: 'Tourism',
    value: '$36B+ annual reef-linked tourism',
    exposure: 'Small island states, Indonesia, Caribbean and Australia coastal economies',
  },
  {
    category: 'Fisheries',
    value: '500M+ people dependent',
    exposure: 'Food security and household income across Southeast Asia and Pacific communities',
  },
  {
    category: 'Coastal protection',
    value: '$400M+ avoided US flood damages each year',
    exposure: 'Reduced storm losses for homes, roads, ports, and small businesses',
  },
  {
    category: 'Pharmaceutical potential',
    value: 'High-value marine compound pipeline',
    exposure: 'Future drug discovery opportunities from reef organisms and microbiomes',
  },
] as const

const LOSS_TIMELINE = [
  { year: '1998', note: 'First global bleaching event signaled systemic economic risk for reef tourism.' },
  { year: '2010', note: 'Repeated thermal stress reduced reef productivity in major fisheries regions.' },
  { year: '2016-2017', note: 'Great Barrier Reef bleaching disrupted tourism confidence and local income.' },
  { year: '2020', note: 'Stacked bleaching events increased insurance and adaptation costs for coastlines.' },
  { year: '2024-2025', note: 'Mass bleaching recurrence sharpened urgency for restoration financing models.' },
] as const

export default function CoralImpactEconomyPage() {
  return (
    <CoralImpactShell page="economy" showMobileDonate>
      <section
        className="ci-hero"
        style={{ backgroundImage: `linear-gradient(125deg, rgba(5, 35, 54, 0.78), rgba(5, 35, 54, 0.38)), url(${HERO_IMAGE})` }}
      >
        <div className="ci-hero-content">
          <p className="ci-kicker">Coral Reefs & the Economy</p>
          <h1>$2.7 trillion is at stake when coral systems fail.</h1>
          <p>
            Reefs are not niche ecosystems. They protect coastlines, sustain fisheries, power tourism economies,
            and reduce disaster recovery costs for millions of households.
          </p>
        </div>
      </section>

      <section className="ci-section ci-stat-bar" aria-label="Economic reef statistics">
        {STAT_BAR.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="ci-section ci-content-grid">
        <article>
          <h2>Tourism and jobs move with reef health</h2>
          <p>
            Reef degradation reduces visitor demand, compresses local business margins, and destabilizes public revenue.
            In reef tourism corridors, ecological decline quickly becomes a municipal budget issue.
          </p>
        </article>
        <article>
          <h2>Fisheries are household infrastructure</h2>
          <p>
            Reef fisheries provide both protein and income. When nursery habitat collapses, communities often lose food
            security and earnings at the same time.
          </p>
        </article>
      </section>

      <section className="ci-section">
        <h2>Economic exposure by sector</h2>
        <div className="ci-impact-table" role="table" aria-label="Coral economy impact table">
          <div className="ci-impact-table-head" role="row">
            <span role="columnheader">Sector</span>
            <span role="columnheader">Estimated value</span>
            <span role="columnheader">Who is affected</span>
          </div>
          {IMPACT_ROWS.map((row) => (
            <div className="ci-impact-table-row" role="row" key={row.category}>
              <span role="cell">{row.category}</span>
              <span role="cell">{row.value}</span>
              <span role="cell">{row.exposure}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ci-section ci-map-section">
        <div>
          <h2>Reef-dependent regions</h2>
          <p>
            Hotspots include Australia, the Caribbean, Southeast Asia, and the Indian Ocean where reefs protect revenue,
            infrastructure, and food systems simultaneously.
          </p>
          <ul className="ci-list-tight">
            <li>Australia: Tourism and reef-based employment concentration</li>
            <li>Caribbean: High GDP exposure to coastal tourism and storm losses</li>
            <li>Indonesia: Fisheries, tourism, and community livelihoods overlap</li>
            <li>Indian Ocean islands: Coastal defense dependency is structurally high</li>
          </ul>
        </div>
        <svg className="ci-mini-map" viewBox="0 0 520 300" role="img" aria-label="Stylized world map with reef-dependent regions">
          <rect x="0" y="0" width="520" height="300" rx="20" fill="rgba(11, 51, 73, 0.15)" />
          <path d="M42 114 L138 86 L206 128 L184 170 L98 176 L42 142 Z" fill="rgba(17, 106, 126, 0.42)" />
          <path d="M194 84 L276 76 L342 98 L320 134 L258 142 L208 124 Z" fill="rgba(17, 106, 126, 0.42)" />
          <path d="M266 158 L344 150 L412 184 L376 230 L296 214 Z" fill="rgba(17, 106, 126, 0.42)" />
          <path d="M404 118 L470 112 L492 156 L448 192 L402 168 Z" fill="rgba(17, 106, 126, 0.42)" />
          <circle cx="430" cy="204" r="10" fill="rgba(255, 106, 88, 0.9)" />
          <circle cx="324" cy="206" r="10" fill="rgba(255, 106, 88, 0.9)" />
          <circle cx="112" cy="156" r="10" fill="rgba(255, 106, 88, 0.9)" />
          <circle cx="454" cy="150" r="10" fill="rgba(255, 106, 88, 0.9)" />
        </svg>
      </section>

      <section className="ci-section ci-timeline">
        <h2>Loss timeline: bleaching and economic disruption</h2>
        <div className="ci-timeline-rows">
          {LOSS_TIMELINE.map((item) => (
            <article key={item.year}>
              <strong>{item.year}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="economy" placement="mid" />
      </section>

      <section className="ci-section ci-story">
        <h2>Human moment</h2>
        <blockquote>
          "When our reef degraded, fishing trips got longer and incomes fell. Restoration gave us fish nurseries back,
          and suddenly our village had options again."
        </blockquote>
        <p>Community account inspired by restoration programs in Indonesia.</p>
      </section>

      <section className="ci-section ci-stakes" aria-label="What is at stake">
        <h2>What&apos;s at stake</h2>
        <div>
          <article>
            <h3>Jobs and income</h3>
            <p>Tourism and fisheries jobs disappear when reef cover and biodiversity decline.</p>
          </article>
          <article>
            <h3>Community stability</h3>
            <p>Livelihood disruption increases migration pressure and local economic volatility.</p>
          </article>
          <article>
            <h3>Infrastructure cost</h3>
            <p>Without reef buffers, governments face higher flood defense and disaster recovery bills.</p>
          </article>
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="economy" placement="bottom" />
      </section>
    </CoralImpactShell>
  )
}
