import type { GraphNode, GraphEdge } from '@/types/graph'
import {
  CATEGORY_LABELS,
  DEPENDENCY_SCALE_DESCRIPTION,
  DEPENDENCY_SCALE_LABELS,
  FUNDING_ROLE_LABELS,
  INTERVIEW_STATUS_DESCRIPTIONS,
  RELATIONSHIP_STYLE,
  WILLINGNESS_SCALE_DESCRIPTION,
  WILLINGNESS_SCALE_LABELS,
} from './constants'

interface NodeDetailPanelProps {
  node: GraphNode
  edges: GraphEdge[]
  onClose: () => void
  onNotesChange?: (nodeId: string, notes: string) => void
  notes?: string
  lastSavedAt?: number | null
  saveStatus?: 'cloud' | 'local' | null
}

export default function NodeDetailPanel({
  node,
  edges,
  onClose,
  onNotesChange,
  notes = '',
  lastSavedAt = null,
  saveStatus = null,
}: NodeDetailPanelProps) {
  const showSaved = lastSavedAt != null
  const related = edges.filter((e) => e.source === node.id || e.target === node.id)
  const displayNotes = notes || node.notes
  const fundingRole = FUNDING_ROLE_LABELS[node.funding_role]
  const dependencyLabel = DEPENDENCY_SCALE_LABELS[node.dependency_score] ?? node.dependency_score
  const willingnessLabel =
    WILLINGNESS_SCALE_LABELS[node.willingness_score] ?? node.willingness_score
  const interviewDesc = INTERVIEW_STATUS_DESCRIPTIONS[node.interview_status]

  return (
    <div className="node-detail-panel">
      <div className="node-detail-header">
        <h2>{node.name}</h2>
        <div className="node-detail-header-actions">
          <span className="node-detail-escape-hint" aria-hidden>Esc to close</span>
          <button type="button" className="node-detail-close" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </div>
      </div>

      <section className="node-detail-section">
        <h3 className="node-detail-section-title">Who they are</h3>
        <dl className="node-detail-meta">
          <dt>Category</dt>
          <dd>{CATEGORY_LABELS[node.category]}</dd>
          <dt>Location</dt>
          <dd>{node.location}</dd>
          <dt>Funding role</dt>
          <dd>
            <span className="node-detail-label">{fundingRole.label}</span>
            <p className="node-detail-hint">{fundingRole.description}</p>
          </dd>
        </dl>
      </section>

      <section className="node-detail-section">
        <h3 className="node-detail-section-title">Reef relevance</h3>
        <dl className="node-detail-meta">
          <dt>Dependency on reefs</dt>
          <dd>
            <span className="node-detail-score">
              {node.dependency_score}/5 — {dependencyLabel}
            </span>
            <p className="node-detail-hint">{DEPENDENCY_SCALE_DESCRIPTION}</p>
          </dd>
          <dt>Willingness to pay for reef protection</dt>
          <dd>
            <span className="node-detail-score">
              {node.willingness_score}/5 — {willingnessLabel}
            </span>
            <p className="node-detail-hint">{WILLINGNESS_SCALE_DESCRIPTION}</p>
          </dd>
        </dl>
      </section>

      <section className="node-detail-section">
        <h3 className="node-detail-section-title">Research</h3>
        <dl className="node-detail-meta">
          <dt>Interview status</dt>
          <dd>
            <span className="node-detail-label">{node.interview_status.replace(/_/g, ' ')}</span>
            <p className="node-detail-hint">{interviewDesc}</p>
          </dd>
          <dt>Annual funding (USD)</dt>
          <dd>{node.annual_funding_USD > 0 ? node.annual_funding_USD.toLocaleString() : '—'}</dd>
        </dl>
      </section>

      {node.key_quote && (
        <section className="node-detail-section">
          <h3 className="node-detail-section-title">In their words</h3>
          <blockquote className="node-detail-quote">{node.key_quote}</blockquote>
        </section>
      )}
      <section className="node-detail-edges">
        <h3 className="node-detail-section-title">Relationships</h3>
        <ul>
          {related.map((e) => {
            const other = e.source === node.id ? e.target : e.source
            const style = RELATIONSHIP_STYLE[e.relationship_type]
            const dir = e.source === node.id ? '→' : '←'
            return (
              <li key={e.id}>
                <span className="edge-type" style={{ borderLeftColor: style.stroke }}>
                  {e.relationship_type}
                </span>
                {dir} {other}
                {e.annual_value_USD > 0 && ` ($${e.annual_value_USD.toLocaleString()})`}
              </li>
            )
          })}
        </ul>
      </section>
      {onNotesChange && (
        <section className="node-detail-notes">
          <label htmlFor="node-notes">Interview notes</label>
          {showSaved && (
            <span className={`save-indicator ${saveStatus === 'local' ? 'save-local' : ''}`}>
              {saveStatus === 'local' ? 'Saved locally' : 'Saved'}
            </span>
          )}
          <textarea
            id="node-notes"
            value={displayNotes}
            onChange={(ev) => onNotesChange(node.id, ev.target.value)}
            placeholder="Add notes from field interviews…"
            rows={4}
          />
        </section>
      )}
    </div>
  )
}
