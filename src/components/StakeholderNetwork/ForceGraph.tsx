import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import * as d3 from 'd3'
import type { GraphNode, GraphEdge } from '@/types/graph'
import { CATEGORY_COLORS, RELATIONSHIP_STYLE } from './constants'

interface D3Node extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface D3Link {
  id: string
  source: D3Node | string
  target: D3Node | string
  relationship_type: GraphEdge['relationship_type']
  flow_direction: GraphEdge['flow_direction']
  annual_value_USD: number
  stability: GraphEdge['stability']
  notes: string
}

export interface ForceGraphHandle {
  resetZoom(): void
  zoomIn(): void
  zoomOut(): void
}

interface ForceGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  pathNodeIds: Set<string>
  pathEdgeIds: Set<string>
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  width: number
  height: number
}

const NODE_RADIUS_MIN = 10
const NODE_RADIUS_MAX = 26

function radiusFromNode(node: GraphNode): number {
  const basis = Math.log1p(node.annual_funding_USD || node.dependency_score * 50000)
  const t = Math.min(1, basis / Math.log1p(5e6))
  return NODE_RADIUS_MIN + t * (NODE_RADIUS_MAX - NODE_RADIUS_MIN)
}

const ForceGraph = forwardRef<ForceGraphHandle, ForceGraphProps>(function ForceGraph(
  { nodes, edges, pathNodeIds, pathEdgeIds, selectedNodeId, onSelectNode, width, height },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const selectedIdRef = useRef(selectedNodeId)
  const onSelectCb = useCallback(onSelectNode, [onSelectNode])

  useEffect(() => { selectedIdRef.current = selectedNodeId }, [selectedNodeId])

  useImperativeHandle(ref, () => ({
    resetZoom() {
      if (svgRef.current && zoomRef.current)
        d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity)
    },
    zoomIn() {
      if (svgRef.current && zoomRef.current)
        d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.4)
    },
    zoomOut() {
      if (svgRef.current && zoomRef.current)
        d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.4)
    },
  }))

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const nodeMap = new Map<string, D3Node>()
    const d3Nodes: D3Node[] = nodes.map((n) => {
      const d: D3Node = { ...n }
      if (d.x == null) d.x = width / 2 + (Math.random() - 0.5) * 300
      if (d.y == null) d.y = height / 2 + (Math.random() - 0.5) * 300
      nodeMap.set(n.id, d)
      return d
    })

    const d3Links: D3Link[] = edges.map((e) => ({
      id: e.id,
      source: nodeMap.get(e.source) ?? e.source,
      target: nodeMap.get(e.target) ?? e.target,
      relationship_type: e.relationship_type,
      flow_direction: e.flow_direction,
      annual_value_USD: e.annual_value_USD,
      stability: e.stability,
      notes: e.notes,
    }))

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // ── Defs ──────────────────────────────────────────────────────────
    const defs = svg.append('defs')

    // Background radial gradient
    const bgGrad = defs.append('radialGradient')
      .attr('id', 'fg-bg').attr('cx', '50%').attr('cy', '42%').attr('r', '68%')
    bgGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0e2538')
    bgGrad.append('stop').attr('offset', '100%').attr('stop-color', '#050e18')

    // Vignette
    const vigGrad = defs.append('radialGradient')
      .attr('id', 'fg-vignette').attr('cx', '50%').attr('cy', '50%').attr('r', '70%')
    vigGrad.append('stop').attr('offset', '55%').attr('stop-color', '#000').attr('stop-opacity', '0')
    vigGrad.append('stop').attr('offset', '100%').attr('stop-color', '#000').attr('stop-opacity', '0.55')

    // Node glow filter
    const glowF = defs.append('filter')
      .attr('id', 'fg-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    glowF.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur')
    const gm = glowF.append('feMerge')
    gm.append('feMergeNode').attr('in', 'blur')
    gm.append('feMergeNode').attr('in', 'SourceGraphic')

    // Selected / hovered glow (stronger)
    const selF = defs.append('filter')
      .attr('id', 'fg-sel').attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%')
    selF.append('feGaussianBlur').attr('stdDeviation', '12').attr('result', 'blur')
    const sm = selF.append('feMerge')
    sm.append('feMergeNode').attr('in', 'blur')
    sm.append('feMergeNode').attr('in', 'SourceGraphic')

    // ── Background ────────────────────────────────────────────────────
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#fg-bg)')
    svg.append('rect').attr('width', width).attr('height', height)
      .attr('fill', 'url(#fg-vignette)').style('pointer-events', 'none')

    // ── Zoom group ────────────────────────────────────────────────────
    const g = svg.append('g').attr('class', 'zoom-g')
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', (ev) => g.attr('transform', ev.transform))
    svg.call(zoom)
    zoomRef.current = zoom
    svg.on('click', () => onSelectCb(null))

    // ── Links ─────────────────────────────────────────────────────────
    const link = g.append('g').attr('class', 'links')
      .selectAll('line').data(d3Links).join('line')
      .attr('stroke', (d) => d3.color(RELATIONSHIP_STYLE[d.relationship_type].stroke)?.brighter(0.7).toString() ?? RELATIONSHIP_STYLE[d.relationship_type].stroke)
      .attr('stroke-dasharray', (d) => RELATIONSHIP_STYLE[d.relationship_type].strokeDasharray)
      .attr('stroke-width', (d) =>
        d.relationship_type === 'funding'
          ? Math.min(5, 1.5 + d.annual_value_USD / 400000)
          : RELATIONSHIP_STYLE[d.relationship_type].strokeWidth + 0.5
      )
      .attr('stroke-opacity', 0.4)

    // ── Halos ─────────────────────────────────────────────────────────
    const halo = g.append('g').attr('class', 'halos')
      .selectAll<SVGCircleElement, D3Node>('circle').data(d3Nodes).join('circle')
      .attr('r', (d) => radiusFromNode(d) + 9)
      .attr('fill', (d) => d3.color(CATEGORY_COLORS[d.category])?.copy({ opacity: 0.12 }).toString() ?? 'none')
      .attr('stroke', 'none')
      .style('pointer-events', 'none')

    // ── Nodes ─────────────────────────────────────────────────────────
    const nodeSel = g.append('g').attr('class', 'nodes')
      .selectAll<SVGCircleElement, D3Node>('circle').data(d3Nodes).join('circle')
      .attr('r', (d) => radiusFromNode(d))
      .attr('fill', (d) => d3.color(CATEGORY_COLORS[d.category])?.brighter(0.15).toString() ?? CATEGORY_COLORS[d.category])
      .attr('stroke', (d) => d3.color(CATEGORY_COLORS[d.category])?.brighter(1.3).toString() ?? '#fff')
      .attr('stroke-width', (d) => d.interview_status === 'target' ? 0 : 1.5)
      .attr('stroke-dasharray', (d) => d.interview_status === 'target' ? '4 3' : 'none')
      .attr('filter', 'url(#fg-glow)')
      .style('cursor', 'pointer')

    nodeSel.call(
      d3.drag<SVGCircleElement, D3Node>()
        .on('start', function (event) {
          if (!event.sourceEvent) return
          event.sourceEvent.stopPropagation()
          d3.select(this as SVGCircleElement).raise()
          simRef.current?.alphaTarget(0.3).restart()
        })
        .on('drag', (event, d) => { d.x = event.x; d.y = event.y; ticked() })
        .on('end', () => { simRef.current?.alphaTarget(0) })
    )

    nodeSel.on('click', (ev, d) => {
      ev.stopPropagation()
      onSelectCb(selectedIdRef.current === d.id ? null : d.id)
    })

    // ── Labels ────────────────────────────────────────────────────────
    const label = g.append('g').attr('class', 'labels')
      .selectAll<SVGTextElement, D3Node>('text').data(d3Nodes).join('text')
      .text((d) => d.name)
      .attr('font-size', 11)
      .attr('font-family', 'DM Sans, system-ui, sans-serif')
      .attr('font-weight', '500')
      .attr('fill', '#a8d4ea')
      .attr('paint-order', 'stroke')
      .attr('stroke', 'rgba(5, 14, 24, 0.85)')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('dx', (d) => radiusFromNode(d) + 6)
      .attr('dy', 4)
      .style('pointer-events', 'none')

    // ── Tooltip ───────────────────────────────────────────────────────
    const tip = d3.select('body').append('div').attr('class', 'graph-tooltip')
      .style('position', 'absolute').style('visibility', 'hidden')
      .style('background', 'rgba(5, 14, 24, 0.96)')
      .style('border', '1px solid rgba(100, 160, 210, 0.22)')
      .style('border-radius', '10px')
      .style('padding', '10px 14px')
      .style('font-size', '13px').style('color', '#b0d4e8')
      .style('box-shadow', '0 8px 32px rgba(0,0,0,0.55)')
      .style('z-index', '1000').style('max-width', '260px')
      .style('pointer-events', 'none')

    nodeSel
      .on('mouseover', (_ev, d) => {
        tip.style('visibility', 'visible').html(
          `<strong style="color:#fff;font-size:14px">${d.name}</strong><br/>
           <span style="color:#55acd4;font-size:11px;text-transform:uppercase;letter-spacing:.06em">${d.category.replace(/_/g, ' ')}</span>
           <span style="color:#608ca0;display:block;margin-top:5px">Dependency ${d.dependency_score}/5 · Willingness ${d.willingness_score}/5</span>
           ${d.key_quote ? `<em style="color:#4e6e80;font-size:12px;display:block;margin-top:5px">"${d.key_quote.slice(0, 80)}…"</em>` : ''}`
        )
      })
      .on('mousemove', (e) => tip.style('top', `${(e as MouseEvent).pageY + 14}px`).style('left', `${(e as MouseEvent).pageX + 14}px`))
      .on('mouseout', () => tip.style('visibility', 'hidden'))

    // ── Tick ─────────────────────────────────────────────────────────
    function ticked() {
      link
        .attr('x1', (d) => (d.source as D3Node).x ?? 0).attr('y1', (d) => (d.source as D3Node).y ?? 0)
        .attr('x2', (d) => (d.target as D3Node).x ?? 0).attr('y2', (d) => (d.target as D3Node).y ?? 0)
      halo.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      nodeSel.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    }

    // ── Simulation ────────────────────────────────────────────────────
    const sim = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links).id((d) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-520))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius((d) => radiusFromNode(d) + 14))
      .on('tick', ticked)
    simRef.current = sim

    return () => {
      sim.stop()
      simRef.current = null
      zoomRef.current = null
      d3.selectAll('.graph-tooltip').remove()
    }
  }, [nodes, edges, width, height, onSelectCb])

  // ── Visual state updates (path highlight + selection) ──────────────
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll<SVGLineElement, D3Link>('.links line')
      .attr('stroke-opacity', (d) => pathEdgeIds.size === 0 || pathEdgeIds.has(d.id) ? 0.55 : 0.07)
    svg.selectAll<SVGCircleElement, D3Node>('.nodes circle')
      .attr('opacity', (d) => pathNodeIds.size === 0 || pathNodeIds.has(d.id) ? 1 : 0.18)
      .each(function (d) {
        const sel = d3.select(this)
        if (selectedNodeId === d.id) {
          sel.attr('stroke', '#ffffff').attr('stroke-width', 3).attr('filter', 'url(#fg-sel)')
        } else {
          sel.attr('stroke', d3.color(CATEGORY_COLORS[d.category])?.brighter(1.3).toString() ?? '#fff')
            .attr('stroke-width', d.interview_status === 'target' ? 0 : 1.5)
            .attr('filter', 'url(#fg-glow)')
        }
      })
    svg.selectAll<SVGCircleElement, D3Node>('.halos circle')
      .attr('r', (d) => selectedNodeId === d.id ? radiusFromNode(d) + 16 : radiusFromNode(d) + 9)
      .attr('fill', (d) => {
        const c = d3.color(CATEGORY_COLORS[d.category])
        const opacity = selectedNodeId === d.id ? 0.3 : (pathNodeIds.size === 0 || pathNodeIds.has(d.id) ? 0.12 : 0.03)
        return c?.copy({ opacity }).toString() ?? 'none'
      })
    svg.selectAll<SVGTextElement, D3Node>('.labels text')
      .attr('opacity', (d) => pathNodeIds.size === 0 || pathNodeIds.has(d.id) ? 1 : 0.25)
      .attr('fill', (d) => selectedNodeId === d.id ? '#ffffff' : '#a8d4ea')
  }, [pathNodeIds, pathEdgeIds, selectedNodeId])

  return <svg ref={svgRef} width={width} height={height} style={{ display: 'block' }} />
})

export default ForceGraph
