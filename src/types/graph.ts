export type ActorCategory =
  | 'restoration_operator'
  | 'tourism_dive'
  | 'government'
  | 'investor_funder'
  | 'fisheries'
  | 'insurance_finance'

export type InterviewStatus = 'confirmed' | 'target' | 'completed' | 'not_pursued'

export type RelationshipType = 'funding' | 'dependency' | 'data' | 'regulation' | 'proposed'

export type FlowDirection = 'unidirectional' | 'bidirectional'

export type Stability = 'stable' | 'unstable' | 'potential'

export type FundingRole = 'funder' | 'beneficiary' | 'operator' | 'regulator' | 'both'

export interface GraphNode {
  id: string
  name: string
  category: ActorCategory
  location: string
  dependency_score: number
  willingness_score: number
  interview_status: InterviewStatus
  key_quote: string
  funding_role: FundingRole
  annual_funding_USD: number
  notes: string
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relationship_type: RelationshipType
  flow_direction: FlowDirection
  annual_value_USD: number
  stability: Stability
  notes: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
