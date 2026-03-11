import { useState, useCallback } from 'react'
import ForceGraph from '@/components/StakeholderNetwork/ForceGraph'
import NodeDetailPanel from '@/components/StakeholderNetwork/NodeDetailPanel'
import Legend from '@/components/StakeholderNetwork/Legend'
import Filters from '@/components/StakeholderNetwork/Filters'
import { stakeholderGraph } from '@/data/stakeholders'
import { useGraphData, defaultFilters, type GraphFilters } from '@/hooks/useGraphData'

const STORAGE_KEY_NOTES = 'coral-network-notes'

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes))
}

export default function StakeholderNetworkPage() {
  const [filters, setFilters] = useState<GraphFilters>(defaultFilters)
  const [pathFrom, setPathFrom] = useState<string | null>(null)
  const [pathTo, setPathTo] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeNotes, setNodeNotes] = useState<Record<string, string>>(loadNotes)

  const { filteredNodes, filteredEdges, pathNodeIds, pathEdgeIds } = useGraphData(
    stakeholderGraph.nodes,
    stakeholderGraph.edges,
    filters,
    pathFrom,
    pathTo
  )

  const handleNotesChange = useCallback((nodeId: string, notes: string) => {
    setNodeNotes((prev) => {
      const next = { ...prev, [nodeId]: notes }
      saveNotes(next)
      return next
    })
  }, [])

  const handleExport = useCallback(() => {
    const payload = {
      nodes: filteredNodes,
      edges: filteredEdges,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coral-stakeholder-network-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredNodes, filteredEdges])

  const selectedNode = selectedNodeId
    ? filteredNodes.find((n) => n.id === selectedNodeId) ?? stakeholderGraph.nodes.find((n) => n.id === selectedNodeId)
    : null

  const graphWidth = 1000
  const graphHeight = 700

  return (
    <div className="network-page">
      <h1>Stakeholder Network</h1>
      <p className="network-intro">
        Interactive map of actors and relationships. Click a node to open details; use filters and path highlight to explore.
      </p>
      <div className="network-content">
        <div className="network-side">
          <Filters
            filters={filters}
            setFilters={setFilters}
            pathFrom={pathFrom}
            pathTo={pathTo}
            setPathFrom={setPathFrom}
            setPathTo={setPathTo}
            nodeIds={stakeholderGraph.nodes.map((n) => ({ id: n.id, name: n.name }))}
            onExport={handleExport}
          />
          <Legend />
        </div>
        <div className="network-graph-wrap">
          <ForceGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            pathNodeIds={pathNodeIds}
            pathEdgeIds={pathEdgeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            width={graphWidth}
            height={graphHeight}
          />
        </div>
        {selectedNode && (
          <aside className="network-panel-wrap">
            <NodeDetailPanel
              node={selectedNode}
              edges={stakeholderGraph.edges.filter(
                (e) => e.source === selectedNode.id || e.target === selectedNode.id
              )}
              onClose={() => setSelectedNodeId(null)}
              onNotesChange={handleNotesChange}
              notes={nodeNotes[selectedNode.id]}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
