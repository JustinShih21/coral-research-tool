import { RELATIONSHIP_STYLE } from './constants'
import type { RelationshipType } from '@/types/graph'

const REL_TYPES: RelationshipType[] = [
  'funding',
  'dependency',
  'data',
  'regulation',
  'degradation',
  'proposed',
]

const REL_LABELS: Record<RelationshipType, string> = {
  funding: 'Funding',
  dependency: 'Dependency',
  data: 'Data',
  regulation: 'Regulation',
  degradation: 'Degradation',
  proposed: 'Proposed',
}

export default function Legend() {
  return (
    <div className="nf-legend">
      <div className="nf-legend-section">
        <span className="nf-section-title">Node size = funding scale</span>
      </div>

      <div className="nf-legend-section">
        <span className="nf-section-title">Edge style</span>
        <ul className="nf-legend-edges">
          {REL_TYPES.map((rel) => {
            const s = RELATIONSHIP_STYLE[rel]
            return (
              <li key={rel} className="nf-legend-edge-item">
                <svg width="24" height="8" style={{ flexShrink: 0 }}>
                  <line
                    x1="0" y1="4" x2="24" y2="4"
                    stroke={s.stroke}
                    strokeWidth={Math.min(s.strokeWidth, 2)}
                    strokeDasharray={s.strokeDasharray}
                  />
                </svg>
                <span>{REL_LABELS[rel]}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="nf-legend-section">
        <span className="nf-section-title">Interview status</span>
        <ul className="nf-legend-status">
          <li><span className="nf-legend-ring ring-solid" />Confirmed / Completed</li>
          <li><span className="nf-legend-ring ring-dashed" />Targeted (not yet)</li>
        </ul>
      </div>
    </div>
  )
}
