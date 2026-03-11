import { useEffect, useRef, useCallback } from 'react'
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

const NODE_RADIUS_MIN = 8
const NODE_RADIUS_MAX = 24

function radiusFromNode(node: GraphNode): number {
  const basis = Math.log1p(node.annual_funding_USD || node.dependency_score * 50000)
  const min = 0
  const max = Math.log1p(5e6)
  const t = (basis - min) / (max - min || 1)
  return NODE_RADIUS_MIN + t * (NODE_RADIUS_MAX - NODE_RADIUS_MIN)
}

export default function ForceGraph({
  nodes,
  edges,
  pathNodeIds,
  pathEdgeIds,
  selectedNodeId,
  onSelectNode,
  width,
  height,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null)

  const onSelectNodeCb = useCallback(onSelectNode, [onSelectNode])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const nodeMap = new Map<string, D3Node>()
    const d3Nodes: D3Node[] = nodes.map((n) => {
      const d: D3Node = { ...n }
      if (d.x == null) d.x = width / 2 + (Math.random() - 0.5) * 200
      if (d.y == null) d.y = height / 2 + (Math.random() - 0.5) * 200
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

    const padding = NODE_RADIUS_MAX + 20
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'graph-clip')
      .append('rect')
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g').attr('clip-path', 'url(#graph-clip)')

    const link = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('stroke', (d) => RELATIONSHIP_STYLE[d.relationship_type].stroke)
      .attr('stroke-dasharray', (d) => RELATIONSHIP_STYLE[d.relationship_type].strokeDasharray)
      .attr('stroke-width', (d) => (d.relationship_type === 'funding' ? Math.min(4, 1 + d.annual_value_USD / 500000) : RELATIONSHIP_STYLE[d.relationship_type].strokeWidth))
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'default')

    const nodeSel = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(d3Nodes)
      .join('circle')
      .attr('r', (d) => radiusFromNode(d))
      .attr('fill', (d) => CATEGORY_COLORS[d.category])
      .attr('stroke', (d) => {
        const color = d3.color(CATEGORY_COLORS[d.category])
        return color?.darker(0.5).toString() ?? '#333'
      })
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
    nodeSel
      .call(
        d3
          .drag<SVGCircleElement, D3Node>()
          .on('start', function (event) {
            if (!event.sourceEvent) return
            event.sourceEvent.stopPropagation()
            d3.select(this as SVGCircleElement).raise()
            simRef.current?.restart()
          })
          .on('drag', (event, d) => {
            d.x = event.x
            d.y = event.y
            clampNode(d)
            ticked()
          })
          .on('end', () => {
            simRef.current?.alpha(0.3).restart()
          })
      )
    nodeSel.on('click', (ev, d) => {
      ev.stopPropagation()
      onSelectNodeCb(selectedNodeId === d.id ? null : d.id)
    })

    const label = g
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(d3Nodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', 11)
      .attr('dx', (d) => radiusFromNode(d) + 4)
      .attr('dy', 4)
      .attr('fill', '#0f172a')
      .style('pointer-events', 'none')

    const tooltip = d3.select('body').append('div').attr('class', 'graph-tooltip').style('position', 'absolute').style('visibility', 'hidden').style('background', '#fff').style('border', '1px solid #e2e8f0').style('border-radius', '6px').style('padding', '8px 12px').style('font-size', '13px').style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)').style('z-index', 1000).style('max-width', '280px')

    nodeSel
      .on('mouseover', function (_event, d) {
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>${d.name}</strong><br/>${d.category.replace(/_/g, ' ')}<br/>Dependency: ${d.dependency_score}/5 · Willingness: ${d.willingness_score}/5<br/>Status: ${d.interview_status}${d.key_quote ? `<br/><em>${d.key_quote.slice(0, 80)}…</em>` : ''}`
          )
      })
      .on('mousemove', (e) => {
        tooltip.style('top', `${(e as MouseEvent).pageY + 12}px`).style('left', `${(e as MouseEvent).pageX + 12}px`)
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden')
      })

    function clampNode(d: D3Node) {
      const r = radiusFromNode(d)
      const minX = r + padding
      const maxX = width - r - padding
      const minY = r + padding
      const maxY = height - r - padding
      d.x = Math.max(minX, Math.min(maxX, d.x ?? width / 2))
      d.y = Math.max(minY, Math.min(maxY, d.y ?? height / 2))
    }

    function ticked() {
      d3Nodes.forEach(clampNode)
      link
        .attr('x1', (d) => (d.source as D3Node).x ?? 0)
        .attr('y1', (d) => (d.source as D3Node).y ?? 0)
        .attr('x2', (d) => (d.target as D3Node).x ?? 0)
        .attr('y2', (d) => (d.target as D3Node).y ?? 0)
      nodeSel.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0)
      label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0)
    }

    const simulation = d3
      .forceSimulation<D3Node>(d3Nodes)
      .force(
        'link',
        d3.forceLink<D3Node, D3Link>(d3Links).id((d) => d.id).distance(120)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius((d) => radiusFromNode(d) + 10))
      .on('tick', ticked)

    simRef.current = simulation

    return () => {
      simulation.stop()
      simRef.current = null
      d3.selectAll('.graph-tooltip').remove()
    }
  }, [nodes, edges, width, height, onSelectNodeCb])

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const link = svg.selectAll<SVGLineElement, D3Link>('.links line')
    const node = svg.selectAll<SVGCircleElement, D3Node>('.nodes circle')
    link.attr('stroke-opacity', (d) => (pathEdgeIds.size === 0 || pathEdgeIds.has(d.id) ? 0.8 : 0.15))
    node.attr('opacity', (d) => (pathNodeIds.size === 0 || pathNodeIds.has(d.id) ? 1 : 0.35)).attr('stroke-width', (d) => (selectedNodeId === d.id ? 4 : 1.5))
    node.each(function (this: SVGCircleElement, d) {
      const sel = d3.select(this)
      sel.attr('stroke', () => {
        if (selectedNodeId === d.id) return '#0a1e3a'
        const color = d3.color(CATEGORY_COLORS[d.category])
        return color?.darker(0.5).toString() ?? '#333'
      })
      sel.attr('stroke-dasharray', d.interview_status === 'target' ? '4 3' : 'none')
    })
  }, [pathNodeIds, pathEdgeIds, selectedNodeId])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
      onClick={() => onSelectNode(null)}
    />
  )
}
