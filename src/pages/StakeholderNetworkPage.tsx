import { useState, useCallback, useEffect, useRef } from 'react'
import ForceGraph, { type ForceGraphHandle } from '@/components/StakeholderNetwork/ForceGraph'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const graphRef = useRef<ForceGraphHandle>(null)

  // Escape main padding so the network page fills the full area
  useEffect(() => {
    const main = document.querySelector('.main') as HTMLElement | null
    if (!main) return
    main.classList.add('main--network')
    return () => main.classList.remove('main--network')
  }, [])

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
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedNodeId(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId])

  const handleExport = useCallback(() => {
    const payload = {
      nodes: filteredNodes.map((n) => ({ ...n, notes: nodeNotes[n.id] ?? n.notes })),
      edges: filteredEdges,
      nodeNotesOverride: nodeNotes,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
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
      setGraphSize({ width: Math.max(300, Math.floor(width)), height: Math.max(300, Math.floor(height)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pathActive = pathFrom !== null || pathTo !== null

  return (
    <div className="network-page">
      {/* ── Toolbar ── */}
      <div className="network-toolbar">
        <div className="network-toolbar-left">
          <button
            type="button"
            className={`network-sidebar-btn ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle filters"
          >
            <span className="network-sidebar-btn-icon">
              <span /><span /><span />
            </span>
            <span className="network-sidebar-btn-label">{sidebarOpen ? 'Filters' : 'Filters'}</span>
          </button>
          <div className="network-title-wrap">
            <span className="network-title-label">Stakeholder Network</span>
            <span className="network-title-sub">Indonesia Coral Reef Ecosystem</span>
          </div>
        </div>

        <div className="network-stats">
          <div className="network-stat">
            <span className="network-stat-val">{filteredNodes.length}</span>
            <span className="network-stat-key">actors</span>
          </div>
          <div className="network-stat-sep" />
          <div className="network-stat">
            <span className="network-stat-val">{filteredEdges.length}</span>
            <span className="network-stat-key">connections</span>
          </div>
          {pathActive && (
            <>
              <div className="network-stat-sep" />
              <div className="network-stat network-stat--path">
                <span className="network-stat-val">{pathNodeIds.size}</span>
                <span className="network-stat-key">on path</span>
              </div>
            </>
          )}
        </div>

        <div className="network-toolbar-right">
          <div className="network-zoom-controls">
            <button type="button" onClick={() => graphRef.current?.zoomOut()} aria-label="Zoom out" title="Zoom out">−</button>
            <button type="button" onClick={() => graphRef.current?.resetZoom()} aria-label="Reset zoom" title="Reset zoom">⊙</button>
            <button type="button" onClick={() => graphRef.current?.zoomIn()} aria-label="Zoom in" title="Zoom in">+</button>
          </div>
          <button type="button" className="network-export-btn" onClick={handleExport}>
            Export JSON
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="network-body">
        {/* Sidebar: filters + legend */}
        <aside className={`network-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="network-sidebar-inner">
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
        </aside>

        {/* Graph canvas */}
        <div ref={graphWrapRef} className="network-graph-wrap">
          <ForceGraph
            ref={graphRef}
            nodes={filteredNodes}
            edges={filteredEdges}
            pathNodeIds={pathNodeIds}
            pathEdgeIds={pathEdgeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            width={graphSize.width}
            height={graphSize.height}
          />
          {/* Graph hint */}
          {filteredNodes.length > 0 && !selectedNodeId && (
            <div className="network-graph-hint">
              Click a node to explore · Scroll to zoom · Drag to pan
            </div>
          )}
        </div>

        {/* Detail panel */}
        <aside className={`network-detail-wrap ${selectedNode ? 'open' : ''}`}>
          {selectedNode && (
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
          )}
        </aside>
      </div>
    </div>
  )
}
