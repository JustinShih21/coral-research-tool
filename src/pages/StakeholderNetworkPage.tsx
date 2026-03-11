import { useState, useCallback, useEffect, useRef } from 'react'
import ForceGraph from '@/components/StakeholderNetwork/ForceGraph'
import NodeDetailPanel from '@/components/StakeholderNetwork/NodeDetailPanel'
import Legend from '@/components/StakeholderNetwork/Legend'
import Filters from '@/components/StakeholderNetwork/Filters'
import { stakeholderGraph } from '@/data/stakeholders'
import { useGraphData, defaultFilters, type GraphFilters } from '@/hooks/useGraphData'
import { getResearchData, setResearchData } from '@/lib/researchStorage'

const STORAGE_KEY_NOTES = 'coral-network-notes'

export default function StakeholderNetworkPage() {
  const [filters, setFilters] = useState<GraphFilters>(defaultFilters)
  const [pathFrom, setPathFrom] = useState<string | null>(null)
  const [pathTo, setPathTo] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeNotes, setNodeNotes] = useState<Record<string, string>>({})
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<'cloud' | 'local' | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getResearchData<Record<string, string>>(STORAGE_KEY_NOTES).then((data) => {
      if (data && typeof data === 'object' && !Array.isArray(data)) setNodeNotes(data)
    })
  }, [])

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
      setResearchData(STORAGE_KEY_NOTES, next).then((synced) => {
        setSavedAt(Date.now())
        setSaveStatus(synced ? 'cloud' : 'local')
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          setSavedAt(null)
          setSaveStatus(null)
        }, 2000)
      })
      return next
    })
  }, [])

  useEffect(() => () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }, [])

  useEffect(() => {
    if (!selectedNodeId) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId])

  const handleExport = useCallback(() => {
    const nodesWithNotes = filteredNodes.map((node) => ({
      ...node,
      notes: nodeNotes[node.id] ?? node.notes,
    }))
    const payload = {
      nodes: nodesWithNotes,
      edges: filteredEdges,
      nodeNotesOverride: nodeNotes,
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
  }, [filteredNodes, filteredEdges, nodeNotes])

  const selectedNode = selectedNodeId
    ? filteredNodes.find((n) => n.id === selectedNodeId) ?? stakeholderGraph.nodes.find((n) => n.id === selectedNodeId)
    : null

  const graphWrapRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ width: 800, height: 500 })

  useEffect(() => {
    const el = graphWrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 800, height: 500 }
      setGraphSize({
        width: Math.max(300, Math.floor(width)),
        height: Math.max(300, Math.floor(height)),
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="network-page">
      <h1>Stakeholder Network</h1>
      <p className="network-intro">
        Interactive map of beneficiaries, protection actors, governance institutions, and degradation drivers. Click a node for details; use filters and path highlight to inspect coordination and financing gaps.
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
        <div ref={graphWrapRef} className="network-graph-wrap">
          <ForceGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            pathNodeIds={pathNodeIds}
            pathEdgeIds={pathEdgeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            width={graphSize.width}
            height={graphSize.height}
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
              lastSavedAt={savedAt}
              saveStatus={saveStatus}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
