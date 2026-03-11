import { useState } from 'react'
import { caseStudies } from '@/data/caseStudies'

export default function CaseStudies() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="case-studies">
      <h1>Case Studies</h1>
      <p className="cases-intro">
        Comparative environmental financing cases used to identify why some ecosystems become fundable while coral reefs remain underfunded.
      </p>
      <div className="case-cards">
        {caseStudies.map((c) => (
          <article
            key={c.id}
            className={`case-card ${expandedId === c.id ? 'expanded' : ''}`}
          >
            <button
              type="button"
              className="case-card-header"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              aria-expanded={expandedId === c.id}
            >
              <h2>{c.title}</h2>
              <span className="case-toggle" aria-hidden>{expandedId === c.id ? '−' : '+'}</span>
            </button>
            <div className="case-body-wrap" data-expanded={expandedId === c.id}>
              <div className="case-body">
                <p className="case-summary">{c.summary}</p>
                <h4>Relevance to reef financing</h4>
                <p className="case-relevance">{c.relevance}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
