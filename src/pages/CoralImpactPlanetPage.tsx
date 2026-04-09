import CoralImpactShell from '@/components/coral-impact/CoralImpactShell'
import DonateConversionBlock from '@/components/coral-impact/DonateConversionBlock'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=1800&q=80'

const STAT_BAR = [
  { value: '200M+', label: 'People protected from flooding by reef systems' },
  { value: '50%', label: 'Global coral already lost since the 1950s' },
  { value: '>99%', label: 'Projected reef loss at 2°C warming' },
] as const

const ACT_PATH = [
  '2026: Restoration financing scaled for priority coastal zones',
  '2030: Local coral nurseries and heat-resilient strains expanded',
  '2040: Loss slows as adaptation + emissions action compound',
  '2050+: Functional reef networks persist in restored corridors',
] as const

const NO_ACT_PATH = [
  '2026: Bleaching intervals continue to shrink',
  '2035: Chronic thermal stress suppresses recovery windows',
  '2050: Major reef systems lose structural functionality',
  '2070: Functional extinction risk for many reef ecosystems',
] as const

export default function CoralImpactPlanetPage() {
  return (
    <CoralImpactShell page="climate" showMobileDonate>
      <section
        className="ci-hero"
        style={{ backgroundImage: `linear-gradient(125deg, rgba(6, 30, 44, 0.86), rgba(6, 30, 44, 0.36)), url(${HERO_IMAGE})` }}
      >
        <div className="ci-hero-content">
          <p className="ci-kicker">Coral Reefs & Planet Stability</p>
          <h1>Coral reefs are planetary infrastructure. And they are failing.</h1>
          <p>
            Reef decline amplifies shoreline erosion, flood risk, food insecurity, and biodiversity collapse.
            Protecting reefs is climate adaptation, not optional conservation.
          </p>
        </div>
      </section>

      <section className="ci-section ci-stat-bar" aria-label="Planetary reef statistics">
        {STAT_BAR.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="ci-section ci-content-grid">
        <article>
          <h2>Coastline protection in numbers</h2>
          <p>
            Reefs absorb wave energy and reduce flood depth, protecting homes, transport corridors, and essential
            services. Where reefs are degraded, coastal defenses become more expensive and less effective.
          </p>
        </article>
        <article>
          <h2>Acidification and bleaching mechanics</h2>
          <p>
            Warmer oceans and declining carbonate chemistry weaken coral calcification. Mass bleaching events then push
            already stressed systems beyond recovery thresholds.
          </p>
        </article>
      </section>

      <section className="ci-section ci-feedback-loop">
        <h2>Climate feedback loop</h2>
        <svg viewBox="0 0 520 520" className="ci-loop-diagram" role="img" aria-label="Coral-climate feedback loop">
          <circle cx="260" cy="260" r="210" fill="none" stroke="rgba(25, 118, 132, 0.28)" strokeWidth="42" />
          <circle cx="260" cy="260" r="138" fill="none" stroke="rgba(255, 106, 88, 0.24)" strokeWidth="32" />
          <text x="260" y="88" textAnchor="middle">Acidification</text>
          <text x="432" y="184" textAnchor="middle">Bleaching</text>
          <text x="432" y="344" textAnchor="middle">Structural Loss</text>
          <text x="260" y="438" textAnchor="middle">Flood Risk</text>
          <text x="88" y="344" textAnchor="middle">Erosion</text>
          <text x="88" y="184" textAnchor="middle">Runoff</text>
        </svg>
      </section>

      <section className="ci-section ci-projection">
        <h2>Projected reef cover trajectory (illustrative)</h2>
        <svg viewBox="0 0 860 340" className="ci-projection-chart" role="img" aria-label="Projected reef cover line chart">
          <rect x="40" y="20" width="780" height="280" rx="18" fill="rgba(4, 30, 45, 0.08)" />
          <line x1="70" y1="260" x2="790" y2="260" stroke="currentColor" strokeOpacity="0.32" />
          <line x1="70" y1="80" x2="790" y2="80" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="5 6" />
          <polyline
            fill="none"
            stroke="rgba(255, 106, 88, 0.95)"
            strokeWidth="5"
            points="70,96 180,128 290,162 400,196 510,236 620,262 730,282 790,296"
          />
          <text x="70" y="298">1950</text>
          <text x="318" y="298">2000</text>
          <text x="560" y="298">2050</text>
          <text x="748" y="298">2100</text>
          <text x="84" y="68">High reef cover</text>
          <text x="86" y="278">Low reef cover</text>
        </svg>
      </section>

      <section className="ci-section ci-two-path">
        <h2>Two-path timeline: Act vs Don&apos;t Act</h2>
        <div className="ci-path-grid">
          <article>
            <h3>Act</h3>
            <ol>
              {ACT_PATH.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article>
            <h3>Don&apos;t Act</h3>
            <ol>
              {NO_ACT_PATH.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="climate" placement="mid" />
      </section>

      <section className="ci-section ci-story">
        <h2>Human moment</h2>
        <blockquote>
          "Our village didn&apos;t just lose coral. We lost the wave break that protected homes for generations."
        </blockquote>
        <p>Coastal community account from a reef-dependent shoreline.</p>
      </section>

      <section className="ci-section ci-stakes" aria-label="What is at stake">
        <h2>What&apos;s at stake</h2>
        <div>
          <article>
            <h3>Coastline safety</h3>
            <p>Storm damage, erosion, and displacement rise as reef structures collapse.</p>
          </article>
          <article>
            <h3>Climate resilience</h3>
            <p>Marine adaptation capacity weakens when interconnected reef ecosystems fail.</p>
          </article>
          <article>
            <h3>Irreversible loss</h3>
            <p>Delay narrows restoration windows and increases the risk of functional extinction.</p>
          </article>
        </div>
      </section>

      <section className="ci-section">
        <DonateConversionBlock page="climate" placement="bottom" />
      </section>
    </CoralImpactShell>
  )
}
