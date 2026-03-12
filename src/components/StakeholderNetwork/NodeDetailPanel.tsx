import type { GraphNode, GraphEdge } from '@/types/graph'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  DEPENDENCY_SCALE_LABELS,
  FUNDING_ROLE_LABELS,
  INTERVIEW_STATUS_DESCRIPTIONS,
  RELATIONSHIP_STYLE,
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
  /** When false, notes are read-only and show "Log in to save" */
  canSave?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:   { label: 'Confirmed',   color: '#16a34a', bg: 'rgba(22, 163, 74, 0.1)' },
  completed:   { label: 'Completed',   color: '#0a1e3a', bg: 'rgba(10, 30, 58, 0.1)' },
  target:      { label: 'Targeted',    color: '#b45309', bg: 'rgba(180, 83, 9, 0.1)' },
  not_pursued: { label: 'Not pursued', color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' },
}

function ScoreBar({ score, max = 5, color }: { score: number; max?: number; color: string }) {
  return (
    <div className="ndp-score-wrap">
      <div className="ndp-score-bar-track">
        <div
          className="ndp-score-bar-fill"
          style={{ width: `${(score / max) * 100}%`, background: color }}
        />
      </div>
      <span className="ndp-score-num">{score}<span className="ndp-score-denom">/{max}</span></span>
    </div>
  )
}

export default function NodeDetailPanel({
  node,
  edges,
  onClose,
  onNotesChange,
  notes = '',
  lastSavedAt = null,
  saveStatus = null,
  canSave = true,
}: NodeDetailPanelProps) {
  const showSaved = canSave && lastSavedAt != null
  const related = edges.filter((e) => e.source === node.id || e.target === node.id)
  const displayNotes = notes || node.notes
  const fundingRole = FUNDING_ROLE_LABELS[node.funding_role]
  const dependencyLabel = DEPENDENCY_SCALE_LABELS[node.dependency_score] ?? node.dependency_score
  const willingnessLabel = WILLINGNESS_SCALE_LABELS[node.willingness_score] ?? node.willingness_score
  const interviewDesc = INTERVIEW_STATUS_DESCRIPTIONS[node.interview_status]
  const statusCfg = STATUS_CONFIG[node.interview_status] ?? STATUS_CONFIG.not_pursued
  const catColor = CATEGORY_COLORS[node.category]

  return (
    <div className="ndp">
      {/* Header */}
      <div className="ndp-header" style={{ borderTopColor: catColor }}>
        <div className="ndp-header-top">
          <span className="ndp-category-badge" style={{ background: `${catColor}1a`, color: catColor }}>
            <span className="ndp-category-icon">{CATEGORY_ICONS[node.category]}</span>
            {CATEGORY_LABELS[node.category]}
          </span>
          <button type="button" className="ndp-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <h2 className="ndp-name">{node.name}</h2>
        <div className="ndp-meta-row">
          <span className="ndp-location">📍 {node.location}</span>
          <span
            className="ndp-status-badge"
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="ndp-body">
        {/* Scores */}
        <section className="ndp-section">
          <h3 className="ndp-section-title">Reef Relevance</h3>
          <div className="ndp-scores">
            <div className="ndp-score-row">
              <span className="ndp-score-label">Dependency</span>
              <span className="ndp-score-desc">{dependencyLabel}</span>
              <ScoreBar score={node.dependency_score} color={catColor} />
            </div>
            <div className="ndp-score-row">
              <span className="ndp-score-label">Willingness to pay</span>
              <span className="ndp-score-desc">{willingnessLabel}</span>
              <ScoreBar score={node.willingness_score} color="#c8922a" />
            </div>
          </div>
        </section>

        {/* Funding */}
        <section className="ndp-section">
          <h3 className="ndp-section-title">Funding Role</h3>
          <div className="ndp-funding-wrap">
            <span className="ndp-funding-label">{fundingRole.label}</span>
            <p className="ndp-funding-desc">{fundingRole.description}</p>
            {node.annual_funding_USD > 0 && (
              <p className="ndp-funding-amount">
                <span className="ndp-amount-val">${node.annual_funding_USD.toLocaleString()}</span>
                <span className="ndp-amount-key"> / year</span>
              </p>
            )}
          </div>
        </section>

        {/* Interview */}
        <section className="ndp-section">
          <h3 className="ndp-section-title">Research</h3>
          <div className="ndp-interview-row">
            <span className="ndp-interview-status" style={{ color: statusCfg.color, background: statusCfg.bg }}>
              {statusCfg.label}
            </span>
            <span className="ndp-interview-desc">{interviewDesc}</span>
          </div>
        </section>

        {/* Key quote */}
        {node.key_quote && (
          <section className="ndp-section">
            <h3 className="ndp-section-title">In Their Words</h3>
            <blockquote className="ndp-quote" style={{ borderLeftColor: catColor }}>
              {node.key_quote}
            </blockquote>
          </section>
        )}

        {/* Relationships */}
        {related.length > 0 && (
          <section className="ndp-section">
            <h3 className="ndp-section-title">Relationships <span className="ndp-count">{related.length}</span></h3>
            <ul className="ndp-edges">
              {related.map((e) => {
                const other = e.source === node.id ? e.target : e.source
                const style = RELATIONSHIP_STYLE[e.relationship_type]
                const dir = e.source === node.id ? '→' : '←'
                return (
                  <li key={e.id} className="ndp-edge-item">
                    <span
                      className="ndp-edge-type"
                      style={{ borderLeftColor: style.stroke, color: style.stroke }}
                    >
                      {e.relationship_type}
                    </span>
                    <span className="ndp-edge-dir">{dir}</span>
                    <span className="ndp-edge-other">{other}</span>
                    {e.annual_value_USD > 0 && (
                      <span className="ndp-edge-amount">${e.annual_value_USD.toLocaleString()}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Notes */}
        {onNotesChange && (
          <section className="ndp-section ndp-notes-section">
            <div className="ndp-notes-header">
              <h3 className="ndp-section-title">Interview Notes</h3>
              {!canSave && (
                <span className="ndp-save-hint">Log in to save notes</span>
              )}
              {showSaved && (
                <span className={`ndp-save-indicator ${saveStatus === 'local' ? 'local' : ''}`}>
                  {saveStatus === 'local' ? '● Saved locally' : '✓ Saved'}
                </span>
              )}
            </div>
            <textarea
              className="ndp-notes-textarea"
              value={displayNotes}
              onChange={(ev) => onNotesChange(node.id, ev.target.value)}
              placeholder={canSave ? 'Add field interview notes, observations, or follow-up items…' : 'Log in to save notes'}
              readOnly={!canSave}
              rows={4}
            />
          </section>
        )}
      </div>
    </div>
  )
}
