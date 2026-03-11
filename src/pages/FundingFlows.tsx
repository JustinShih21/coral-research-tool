import { useMemo, useState, useCallback } from 'react'
import { stakeholderGraph } from '@/data/stakeholders'

const fundingEdges = stakeholderGraph.edges.filter((e) => e.relationship_type === 'funding')

const nodeNames: Record<string, string> = Object.fromEntries(
  stakeholderGraph.nodes.map((n) => [n.id, n.name])
)

type SortKey = 'source' | 'target' | 'value' | 'stability'
type SortDir = 'asc' | 'desc'

const STABILITY_ORDER: Record<string, number> = { stable: 3, moderate: 2, unstable: 2, volatile: 1, potential: 1 }

export default function FundingFlows() {
  const [sortKey, setSortKey] = useState<SortKey>('value')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    return fundingEdges.map((e) => ({
      source: nodeNames[e.source] ?? e.source,
      target: nodeNames[e.target] ?? e.target,
      value: e.annual_value_USD,
      stability: e.stability,
    }))
  }, [])

  const sortedRows = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'source') cmp = a.source.localeCompare(b.source)
      else if (sortKey === 'target') cmp = a.target.localeCompare(b.target)
      else if (sortKey === 'value') cmp = a.value - b.value
      else cmp = (STABILITY_ORDER[a.stability] ?? 0) - (STABILITY_ORDER[b.stability] ?? 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rows, sortKey, sortDir])

  const total = rows.reduce((s, r) => s + r.value, 0)

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir(key === 'value' ? 'desc' : 'asc')
      return key
    })
  }, [])

  return (
    <div className="funding-flows">
      <h1>Funding Flows</h1>
      <p className="flows-intro">
        Current channels captured in the stakeholder graph. Most flows remain project-based and are not yet embedded in durable institutions.
      </p>
      <div className="flows-summary">
        <strong>Total annual funding (from graph):</strong> ${total.toLocaleString()} USD
      </div>
      <div className="flows-table-wrap">
        <table className="flows-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="flows-th-sort" onClick={() => handleSort('source')}>
                  From {sortKey === 'source' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button type="button" className="flows-th-sort" onClick={() => handleSort('target')}>
                  To {sortKey === 'target' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button type="button" className="flows-th-sort" onClick={() => handleSort('value')}>
                  Annual (USD) {sortKey === 'value' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th>
                <button type="button" className="flows-th-sort" onClick={() => handleSort('stability')}>
                  Stability {sortKey === 'stability' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r, i) => (
              <tr key={i}>
                <td>{r.source}</td>
                <td>{r.target}</td>
                <td>{r.value > 0 ? r.value.toLocaleString() : '—'}</td>
                <td>
                  <span className={`stability-badge stability-${r.stability}`}>{r.stability}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flows-notes">
        <h3>Framework interpretation</h3>
        <p>
          Comparative evidence suggests ecosystems attract durable funding when economic losses are visible and
          a policy or market mechanism makes payment obligatory. Coral reefs still rely heavily on fragmented grants,
          while long ecological recovery timelines and fragmented governance reduce multi-year commitments.
        </p>
      </div>
    </div>
  )
}
