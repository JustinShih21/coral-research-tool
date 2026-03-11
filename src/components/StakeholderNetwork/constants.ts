import type { ActorCategory, FundingRole, InterviewStatus, RelationshipType } from '@/types/graph'

export const CATEGORY_COLORS: Record<ActorCategory, string> = {
  restoration_operator: '#007B6E',
  tourism_dive: '#2E6B8A',
  government: '#0A1E3A',
  investor_funder: '#C8922A',
  fisheries: '#2D7A4A',
  degradation_driver: '#C2410C',
  insurance_finance: '#5B3A8A',
}

export const CATEGORY_LABELS: Record<ActorCategory, string> = {
  restoration_operator: 'Restoration',
  tourism_dive: 'Tourism / Dive',
  government: 'Government',
  investor_funder: 'Investors / Funders',
  fisheries: 'Fisheries',
  degradation_driver: 'Degradation Drivers',
  insurance_finance: 'Insurance / Finance',
}

export const INTERVIEW_STATUS_STROKE: Record<InterviewStatus, string> = {
  target: '2px dashed #64748b',
  confirmed: '2px solid #007b6e',
  completed: '3px solid #0a1e3a',
  not_pursued: '1px solid #cbd5e1',
}

export const RELATIONSHIP_STYLE: Record<
  RelationshipType,
  { stroke: string; strokeDasharray: string; strokeWidth: number }
> = {
  funding: { stroke: '#C8922A', strokeDasharray: 'none', strokeWidth: 2 },
  dependency: { stroke: '#2E6B8A', strokeDasharray: '6 4', strokeWidth: 1.5 },
  data: { stroke: '#007B6E', strokeDasharray: '2 3', strokeWidth: 1 },
  regulation: { stroke: '#0A1E3A', strokeDasharray: 'none', strokeWidth: 1 },
  degradation: { stroke: '#C2410C', strokeDasharray: '3 4', strokeWidth: 1.5 },
  proposed: { stroke: '#94a3b8', strokeDasharray: '8 4', strokeWidth: 1 },
}

/** 1–5: How much this actor's livelihood or operations depend on reef health. */
export const DEPENDENCY_SCALE_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Some',
  3: 'Moderate',
  4: 'High',
  5: 'Critical',
}
export const DEPENDENCY_SCALE_DESCRIPTION =
  'How much this actor’s livelihood or operations depend on reef health.'

/** 0–5: Willingness to pay or contribute to reef protection. */
export const WILLINGNESS_SCALE_LABELS: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Some',
  3: 'Moderate',
  4: 'High',
  5: 'High',
}
export const WILLINGNESS_SCALE_DESCRIPTION =
  'Willingness to pay or contribute to reef protection and recovery.'

export const FUNDING_ROLE_LABELS: Record<FundingRole, { label: string; description: string }> = {
  funder: { label: 'Funder', description: 'Provides funding for reef protection or restoration.' },
  beneficiary: {
    label: 'Beneficiary',
    description: 'Benefits from reef (e.g. tourism, fisheries, ecosystem services).',
  },
  operator: {
    label: 'Operator',
    description: 'Runs restoration, conservation, or related operations.',
  },
  regulator: {
    label: 'Regulator',
    description: 'Sets rules, enforcement, or policy affecting reefs.',
  },
  both: {
    label: 'Funder & beneficiary',
    description: 'Both provides funding and receives benefit from reef health.',
  },
}

export const INTERVIEW_STATUS_DESCRIPTIONS: Record<InterviewStatus, string> = {
  target: 'Planned for interview.',
  confirmed: 'Interview scheduled.',
  completed: 'Interview completed.',
  not_pursued: 'Not interviewing.',
}
