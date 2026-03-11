import { useMemo } from 'react'
import type { GraphNode, GraphEdge, ActorCategory, RelationshipType, InterviewStatus } from '@/types/graph'

export interface GraphFilters {
  categories: Set<ActorCategory>
  relationshipTypes: Set<RelationshipType>
  interviewStatuses: Set<InterviewStatus>
}

const defaultFilters = (): GraphFilters => ({
  categories: new Set(),
  relationshipTypes: new Set(),
  interviewStatuses: new Set(),
})

function applyFilters(
  nodes: GraphNode[],
  edges: GraphEdge[],
  filters: GraphFilters
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  let filteredNodes = nodes
  let filteredEdges = edges

  if (filters.categories.size > 0) {
    filteredNodes = filteredNodes.filter((n) => filters.categories.has(n.category))
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    filteredEdges = filteredEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    )
  }
  if (filters.relationshipTypes.size > 0) {
    filteredEdges = filteredEdges.filter((e) => filters.relationshipTypes.has(e.relationship_type))
    const nodeIds = new Set<string>()
    filteredEdges.forEach((e) => {
      nodeIds.add(e.source)
      nodeIds.add(e.target)
    })
    filteredNodes = filteredNodes.filter((n) => nodeIds.has(n.id))
  }
  if (filters.interviewStatuses.size > 0) {
    filteredNodes = filteredNodes.filter((n) => filters.interviewStatuses.has(n.interview_status))
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    filteredEdges = filteredEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    )
  }

  return { nodes: filteredNodes, edges: filteredEdges }
}

function bfsPath(
  fromId: string,
  toId: string,
  edges: GraphEdge[]
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const adj = new Map<string, { neighbor: string; edgeId: string }[]>()
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push({ neighbor: e.target, edgeId: e.id })
  })
  const queue: { id: string; edgeIds: string[] }[] = [{ id: fromId, edgeIds: [] }]
  const visited = new Set<string>([fromId])
  while (queue.length > 0) {
    const { id, edgeIds } = queue.shift()!
    if (id === toId) {
      const pathEdges = new Set(edgeIds)
      const pathNodes = new Set<string>()
      pathNodes.add(fromId)
      pathNodes.add(toId)
      edges.forEach((e) => {
        if (pathEdges.has(e.id)) {
          pathNodes.add(e.source)
          pathNodes.add(e.target)
        }
      })
      return { nodeIds: pathNodes, edgeIds: pathEdges }
    }
    for (const { neighbor, edgeId } of adj.get(id) ?? []) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      queue.push({ id: neighbor, edgeIds: [...edgeIds, edgeId] })
    }
  }
  return { nodeIds: new Set(), edgeIds: new Set() }
}

export function useGraphData(
  nodes: GraphNode[],
  edges: GraphEdge[],
  filters: GraphFilters,
  pathFrom: string | null,
  pathTo: string | null
) {
  const { nodes: filteredNodes, edges: filteredEdges } = useMemo(() => {
    const empty = filters.categories.size === 0 && filters.relationshipTypes.size === 0 && filters.interviewStatuses.size === 0
    if (empty) return { nodes, edges }
    return applyFilters(nodes, edges, filters)
  }, [nodes, edges, filters])

  const { pathNodeIds, pathEdgeIds } = useMemo(() => {
    if (!pathFrom || !pathTo || pathFrom === pathTo) return { pathNodeIds: new Set<string>(), pathEdgeIds: new Set<string>() }
    const { nodeIds, edgeIds } = bfsPath(pathFrom, pathTo, filteredEdges)
    return { pathNodeIds: nodeIds, pathEdgeIds: edgeIds }
  }, [pathFrom, pathTo, filteredEdges])

  return {
    filteredNodes,
    filteredEdges,
    pathNodeIds,
    pathEdgeIds,
  }
}

export { defaultFilters }
