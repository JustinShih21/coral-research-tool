import type { ActorCategory, RelationshipType, InterviewStatus } from '@/types/graph'
import type { GraphFilters } from '@/hooks/useGraphData'
import { CATEGORY_LABELS } from './constants'

const CATEGORIES: ActorCategory[] = [
  'restoration_operator',
  'tourism_dive',
  'government',
  'investor_funder',
  'fisheries',
  'insurance_finance',
]

const REL_TYPES: RelationshipType[] = ['funding', 'dependency', 'data', 'regulation', 'proposed']

const STATUSES: InterviewStatus[] = ['confirmed', 'target', 'completed', 'not_pursued']

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

export default function Filters({
  filters,
  setFilters,
  pathFrom,
  pathTo,
  setPathFrom,
  setPathTo,
  nodeIds,
  onExport,
}: FiltersProps) {
  return (
    <div className="network-filters">
      <div className="filter-group">
        <h4>Actor category</h4>
        {CATEGORIES.map((cat) => (
          <label key={cat}>
            <input
              type="checkbox"
              checked={filters.categories.has(cat)}
              onChange={() =>
                setFilters({ ...filters, categories: toggleSet(filters.categories, cat) })
              }
            />
            {CATEGORY_LABELS[cat]}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h4>Relationship type</h4>
        {REL_TYPES.map((rel) => (
          <label key={rel}>
            <input
              type="checkbox"
              checked={filters.relationshipTypes.has(rel)}
              onChange={() =>
                setFilters({
                  ...filters,
                  relationshipTypes: toggleSet(filters.relationshipTypes, rel),
                })
              }
            />
            {rel}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h4>Interview status</h4>
        {STATUSES.map((s) => (
          <label key={s}>
            <input
              type="checkbox"
              checked={filters.interviewStatuses.has(s)}
              onChange={() =>
                setFilters({
                  ...filters,
                  interviewStatuses: toggleSet(filters.interviewStatuses, s),
                })
              }
            />
            {s.replace(/_/g, ' ')}
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h4>Path highlight</h4>
        <label>
          From
          <select
            value={pathFrom ?? ''}
            onChange={(e) => setPathFrom(e.target.value || null)}
          >
            <option value="">—</option>
            {nodeIds.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select value={pathTo ?? ''} onChange={(e) => setPathTo(e.target.value || null)}>
            <option value="">—</option>
            {nodeIds.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-group">
        <button type="button" className="export-btn" onClick={onExport}>
          Export graph (JSON)
        </button>
      </div>
    </div>
  )
}
