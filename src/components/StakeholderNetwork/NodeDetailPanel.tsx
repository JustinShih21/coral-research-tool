import type { GraphNode, GraphEdge } from '@/types/graph'
import { CATEGORY_LABELS } from './constants'
import { RELATIONSHIP_STYLE } from './constants'

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
      <dl className="node-detail-meta">
        <dt>Category</dt>
        <dd>{CATEGORY_LABELS[node.category]}</dd>
        <dt>Location</dt>
        <dd>{node.location}</dd>
        <dt>Funding role</dt>
        <dd>{node.funding_role}</dd>
        <dt>Dependency (1–5)</dt>
        <dd>{node.dependency_score}</dd>
        <dt>Willingness to pay (1–5)</dt>
        <dd>{node.willingness_score}</dd>
        <dt>Interview status</dt>
        <dd>{node.interview_status.replace(/_/g, ' ')}</dd>
        <dt>Annual funding (USD)</dt>
        <dd>{node.annual_funding_USD > 0 ? node.annual_funding_USD.toLocaleString() : '—'}</dd>
      </dl>
      {node.key_quote && (
        <blockquote className="node-detail-quote">{node.key_quote}</blockquote>
      )}
      <section className="node-detail-edges">
        <h3>Relationships</h3>
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
