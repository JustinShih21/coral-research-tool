import { useMemo, useState, type CSSProperties, type SyntheticEvent } from 'react'
import { caseStudies } from '@/data/caseStudies'

type ScoreKey = keyof (typeof caseStudies)[number]['scores']

const SCORE_ROWS: Array<{ key: ScoreKey; label: string }> = [
  { key: 'institutionalEmbedding', label: 'Institutional Embedding' },
  { key: 'damageVisibility', label: 'Damage Visibility' },
  { key: 'financeMaturity', label: 'Finance Maturity' },
  { key: 'reefTransferPotential', label: 'Reef Transfer Potential' },
]

const DEFAULT_WEIGHTS: Record<ScoreKey, number> = {
  institutionalEmbedding: 3,
  damageVisibility: 3,
  financeMaturity: 3,
  reefTransferPotential: 3,
}

export default function CaseStudies() {
  const [expandedId, setExpandedId] = useState<string | null>(caseStudies[0]?.id ?? null)
  const [weights, setWeights] = useState<Record<ScoreKey, number>>(DEFAULT_WEIGHTS)

  const handleImageError = (ev: SyntheticEvent<HTMLImageElement>) => {
    const img = ev.currentTarget
    if (img.dataset.fallbackApplied === 'true') return
    img.dataset.fallbackApplied = 'true'
    img.src = '/reef.svg'
  }

  const portfolioSignals = useMemo(() => {
    const total = caseStudies.length || 1
    const sum = caseStudies.reduce(
      (acc, c) => {
        acc.embedding += c.scores.institutionalEmbedding
        acc.visibility += c.scores.damageVisibility
        acc.transfer += c.scores.reefTransferPotential
        return acc
      },
      { embedding: 0, visibility: 0, transfer: 0 }
    )
    return {
      embedding: Math.round(sum.embedding / total),
      visibility: Math.round(sum.visibility / total),
      transfer: Math.round(sum.transfer / total),
    }
  }, [])

  const rankedCases = useMemo(() => {
    const weightTotal = Object.values(weights).reduce((sum, w) => sum + w, 0) || 1
    return caseStudies
      .map((c) => {
        const weightedScore = SCORE_ROWS.reduce(
          (sum, row) => sum + c.scores[row.key] * weights[row.key],
          0
        )
        const fitScore = Math.round(weightedScore / weightTotal)
        return { ...c, fitScore }
      })
      .sort((a, b) => b.fitScore - a.fitScore)
  }, [weights])

  const recommendedId = rankedCases[0]?.id ?? null

  const applyPreset = (preset: 'balanced' | 'visibility' | 'institutional' | 'market') => {
    if (preset === 'balanced') {
      setWeights(DEFAULT_WEIGHTS)
      return
    }
    if (preset === 'visibility') {
      setWeights({
        institutionalEmbedding: 2,
        damageVisibility: 5,
        financeMaturity: 2,
        reefTransferPotential: 3,
      })
      return
    }
    if (preset === 'institutional') {
      setWeights({
        institutionalEmbedding: 5,
        damageVisibility: 2,
        financeMaturity: 3,
        reefTransferPotential: 2,
      })
      return
    }
    setWeights({
      institutionalEmbedding: 2,
      damageVisibility: 2,
      financeMaturity: 5,
      reefTransferPotential: 4,
    })
  }

  return (
    <div className="case-studies">
      <header className="cases-hero">
        <h1>Case Studies</h1>
        <p className="cases-intro">
          Comparative financing signals from other ecosystems, translated into reef-relevant lessons.
        </p>
        <div className="cases-signal-board">
          <article className="cases-signal-card">
            <span className="cases-signal-label">Avg Institutional Embedding</span>
            <strong>{portfolioSignals.embedding}</strong>
            <span className="cases-signal-unit">/100</span>
          </article>
          <article className="cases-signal-card">
            <span className="cases-signal-label">Avg Damage Visibility</span>
            <strong>{portfolioSignals.visibility}</strong>
            <span className="cases-signal-unit">/100</span>
          </article>
          <article className="cases-signal-card">
            <span className="cases-signal-label">Avg Reef Transfer Potential</span>
            <strong>{portfolioSignals.transfer}</strong>
            <span className="cases-signal-unit">/100</span>
          </article>
        </div>
        <div className="cases-strategy-lab">
          <section className="cases-weight-lab">
            <div className="cases-lab-header">
              <h3>Match Lab</h3>
              <p>Adjust priorities to re-rank which case model best matches reef finance needs.</p>
            </div>
            <div className="cases-preset-row">
              <button type="button" onClick={() => applyPreset('balanced')}>Balanced</button>
              <button type="button" onClick={() => applyPreset('visibility')}>Visibility-led</button>
              <button type="button" onClick={() => applyPreset('institutional')}>Institution-first</button>
              <button type="button" onClick={() => applyPreset('market')}>Market-ready</button>
            </div>
            <div className="cases-weight-grid">
              {SCORE_ROWS.map((row) => (
                <label key={row.key} className="cases-weight-row">
                  <span>{row.label}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={weights[row.key]}
                    onChange={(e) =>
                      setWeights((prev) => ({ ...prev, [row.key]: Number(e.target.value) }))
                    }
                  />
                  <strong>{weights[row.key]}</strong>
                </label>
              ))}
            </div>
          </section>
          <section className="cases-match-board">
            <h3>Best Match Ranking</h3>
            <div className="cases-match-list">
              {rankedCases.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cases-match-chip ${expandedId === c.id ? 'active' : ''} ${idx === 0 ? 'top' : ''}`}
                  onClick={() => setExpandedId(c.id)}
                >
                  <span className="cases-match-rank">#{idx + 1}</span>
                  <span className="cases-match-title">{c.title}</span>
                  <span className="cases-match-score">{c.fitScore}/100</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </header>
      <div className="case-cards">
        {rankedCases.map((c) => (
          <article
            key={c.id}
            className={`case-card ${expandedId === c.id ? 'expanded' : ''}`}
            style={{ '--case-accent': c.accent } as CSSProperties}
          >
            <div className="case-card-top">
              {c.image && (
                <div className="case-card-image">
                  <img src={c.image.url} alt={c.image.alt} loading="lazy" onError={handleImageError} />
                  {c.image.credit && <span className="photo-credit">{c.image.credit}</span>}
                </div>
              )}
              <div className="case-card-snapshot">
                <div className="case-kicker">Funding Trigger</div>
                <p className="case-trigger">{c.fundingTrigger}</p>
                <div className="case-meta-grid">
                  <div>
                    <span className="case-meta-label">Primary payer</span>
                    <strong>{c.primaryPayer}</strong>
                  </div>
                  <div>
                    <span className="case-meta-label">Payback horizon</span>
                    <strong>{c.paybackHorizon}</strong>
                  </div>
                </div>
                <div className="case-quant-grid">
                  {c.quantSignals.map((signal) => (
                    <article key={signal.id} className="case-quant-card">
                      <span className="case-quant-label">{signal.label}</span>
                      <strong>
                        {signal.value}
                        {signal.unit ?? ''}
                      </strong>
                      {signal.note && <span className="case-quant-note">{signal.note}</span>}
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="case-card-header"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              aria-expanded={expandedId === c.id}
            >
              <div>
                <h2>{c.title}</h2>
                <p className="case-header-summary">{c.summary}</p>
              </div>
              <div className="case-header-right">
                {recommendedId === c.id && <span className="case-recommended">Best Match</span>}
                <span className="case-fit-score">{c.fitScore}/100</span>
              </div>
              <span className="case-toggle" aria-hidden>{expandedId === c.id ? '−' : '+'}</span>
            </button>
            <div className="case-body-wrap" data-expanded={expandedId === c.id}>
              <div className="case-body">
                <div className="case-scoreboard">
                  {SCORE_ROWS.map((row) => (
                    <div key={row.key} className="case-score-row">
                      <span className="case-score-label">{row.label}</span>
                      <div className="case-score-track" role="presentation">
                        <span
                          className="case-score-fill"
                          style={{ width: `${c.scores[row.key]}%` }}
                        />
                      </div>
                      <span className="case-score-value">{c.scores[row.key]}</span>
                    </div>
                  ))}
                </div>
                <div className="case-body-grid">
                  <section>
                    <h4>Why this model attracts capital</h4>
                    <ul className="case-points">
                      {c.mechanismPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h4>Relevance to reef financing</h4>
                    <p className="case-relevance">{c.relevance}</p>
                  </section>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
