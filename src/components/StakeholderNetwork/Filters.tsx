import type { ActorCategory, RelationshipType, InterviewStatus } from '@/types/graph'
import type { GraphFilters } from '@/hooks/useGraphData'
import { CATEGORY_COLORS, CATEGORY_LABELS, RELATIONSHIP_STYLE } from './constants'

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

const REL_LABELS: Record<RelationshipType, string> = {
  funding: 'Funding',
  dependency: 'Dependency',
  data: 'Data',
  regulation: 'Regulation',
  degradation: 'Degradation',
  proposed: 'Proposed',
}

const STATUSES: InterviewStatus[] = ['confirmed', 'target', 'completed', 'not_pursued']

const STATUS_LABELS: Record<InterviewStatus, string> = {
  confirmed: 'Confirmed',
  target: 'Targeted',
  completed: 'Completed',
  not_pursued: 'Not pursued',
}

const STATUS_COLORS: Record<InterviewStatus, string> = {
  confirmed: '#16a34a',
  completed: '#0a1e3a',
  target: '#c8922a',
  not_pursued: '#94a3b8',
}

interface FiltersProps {
  filters: GraphFilters
  setFilters: (f: GraphFilters) => void
  pathFrom: string | null
  pathTo: string | null
  setPathFrom: (id: string | null) => void
  setPathTo: (id: string | null) => void
  nodeIds: { id: string; name: string }[]
  onExport: () => void
}

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function allActive<T>(set: Set<T>, all: T[]): boolean {
  return all.every((v) => set.has(v))
}

function toggleAll<T>(set: Set<T>, all: T[]): Set<T> {
  if (allActive(set, all)) return new Set<T>()
  return new Set(all)
}

export default function Filters({
  filters,
  setFilters,
  pathFrom,
  pathTo,
  setPathFrom,
  setPathTo,
  nodeIds,
}: FiltersProps) {
  return (
    <div className="nf-filters">
      {/* Actor Categories */}
      <div className="nf-section">
        <div className="nf-section-header">
          <span className="nf-section-title">Actor Type</span>
          <button
            type="button"
            className="nf-all-btn"
            onClick={() => setFilters({ ...filters, categories: toggleAll(filters.categories, CATEGORIES) })}
          >
            {allActive(filters.categories, CATEGORIES) ? 'Clear' : 'All'}
          </button>
        </div>
        <div className="nf-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`nf-pill ${filters.categories.has(cat) ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, categories: toggleSet(filters.categories, cat) })}
            >
              <span className="nf-pill-dot" style={{ background: CATEGORY_COLORS[cat] }} />
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Relationship Types */}
      <div className="nf-section">
        <div className="nf-section-header">
          <span className="nf-section-title">Relationship</span>
          <button
            type="button"
            className="nf-all-btn"
            onClick={() => setFilters({ ...filters, relationshipTypes: toggleAll(filters.relationshipTypes, REL_TYPES) })}
          >
            {allActive(filters.relationshipTypes, REL_TYPES) ? 'Clear' : 'All'}
          </button>
        </div>
        <div className="nf-pills">
          {REL_TYPES.map((rel) => (
            <button
              key={rel}
              type="button"
              className={`nf-pill ${filters.relationshipTypes.has(rel) ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, relationshipTypes: toggleSet(filters.relationshipTypes, rel) })}
            >
              <svg width="18" height="6" style={{ flexShrink: 0 }}>
                <line
                  x1="0" y1="3" x2="18" y2="3"
                  stroke={RELATIONSHIP_STYLE[rel].stroke}
                  strokeWidth={Math.min(RELATIONSHIP_STYLE[rel].strokeWidth + 0.5, 2.5)}
                  strokeDasharray={RELATIONSHIP_STYLE[rel].strokeDasharray}
                />
              </svg>
              {REL_LABELS[rel]}
            </button>
          ))}
        </div>
      </div>

      {/* Interview Status */}
      <div className="nf-section">
        <div className="nf-section-header">
          <span className="nf-section-title">Interview Status</span>
          <button
            type="button"
            className="nf-all-btn"
            onClick={() => setFilters({ ...filters, interviewStatuses: toggleAll(filters.interviewStatuses, STATUSES) })}
          >
            {allActive(filters.interviewStatuses, STATUSES) ? 'Clear' : 'All'}
          </button>
        </div>
        <div className="nf-pills">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`nf-pill ${filters.interviewStatuses.has(s) ? 'active' : ''}`}
              onClick={() => setFilters({ ...filters, interviewStatuses: toggleSet(filters.interviewStatuses, s) })}
            >
              <span className="nf-pill-dot" style={{ background: STATUS_COLORS[s] }} />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Path Highlight */}
      <div className="nf-section nf-path-section">
        <div className="nf-section-header">
          <span className="nf-section-title">Path Highlight</span>
          {(pathFrom || pathTo) && (
            <button
              type="button"
              className="nf-all-btn"
              onClick={() => { setPathFrom(null); setPathTo(null) }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="nf-path-selects">
          <label className="nf-path-label">
            <span>From</span>
            <select
              className="nf-select"
              value={pathFrom ?? ''}
              onChange={(e) => setPathFrom(e.target.value || null)}
            >
              <option value="">— any —</option>
              {nodeIds.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </label>
          <label className="nf-path-label">
            <span>To</span>
            <select
              className="nf-select"
              value={pathTo ?? ''}
              onChange={(e) => setPathTo(e.target.value || null)}
            >
              <option value="">— any —</option>
              {nodeIds.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
