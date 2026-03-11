import { useMemo } from 'react'
import { stakeholderGraph } from '@/data/stakeholders'

const fundingEdges = stakeholderGraph.edges.filter((e) => e.relationship_type === 'funding')

const nodeNames: Record<string, string> = Object.fromEntries(
  stakeholderGraph.nodes.map((n) => [n.id, n.name])
)

export default function FundingFlows() {
  const rows = useMemo(() => {
    return fundingEdges.map((e) => ({
      source: nodeNames[e.source] ?? e.source,
      target: nodeNames[e.target] ?? e.target,
      value: e.annual_value_USD,
      stability: e.stability,
    }))
  }, [])

  const total = rows.reduce((s, r) => s + r.value, 0)

  return (
    <div className="funding-flows">
      <h1>Funding Flows</h1>
      <p className="flows-intro">
        Current funding channels from the stakeholder network. None are stable or institutionally embedded.
      </p>
      <div className="flows-summary">
        <strong>Total annual funding (from graph):</strong> ${total.toLocaleString()} USD
      </div>
      <div className="flows-table-wrap">
        <table className="flows-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Annual (USD)</th>
              <th>Stability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
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
        <h3>From PRD</h3>
        <p>
          Three primary channels: philanthropic grants (project cycles), corporate ESG / carbon
          (early stage), government/bilateral (reefs not classified as infrastructure). The
          pipeline breaks between valuation and funding mechanism — no institutional channel
          converts recognized value into payment obligation.
        </p>
      </div>
    </div>
  )
}
