import { CATEGORY_COLORS, CATEGORY_LABELS, RELATIONSHIP_STYLE } from './constants'
import type { ActorCategory, RelationshipType } from '@/types/graph'

const CATEGORIES: ActorCategory[] = [
  'restoration_operator',
  'tourism_dive',
  'government',
  'investor_funder',
  'fisheries',
  'degradation_driver',
  'insurance_finance',
]

const REL_TYPES: RelationshipType[] = [
  'funding',
  'dependency',
  'data',
  'regulation',
  'degradation',
  'proposed',
]

export default function Legend() {
  return (
    <div className="network-legend">
      <div className="legend-block">
        <h4>Node (actor type)</h4>
        <ul className="legend-nodes">
          {CATEGORIES.map((cat) => (
            <li key={cat}>
              <span className="legend-dot" style={{ background: CATEGORY_COLORS[cat] }} />
              {CATEGORY_LABELS[cat]}
            </li>
          ))}
        </ul>
      </div>
      <div className="legend-block">
        <h4>Edge (relationship)</h4>
        <ul className="legend-edges">
          {REL_TYPES.map((rel) => {
            const s = RELATIONSHIP_STYLE[rel]
            return (
              <li key={rel}>
                <svg width={32} height={8} className="legend-line-svg">
                  <line
                    x1={0}
                    y1={4}
                    x2={32}
                    y2={4}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth}
                    strokeDasharray={s.strokeDasharray}
                  />
                </svg>
                {rel}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
