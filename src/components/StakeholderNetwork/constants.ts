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

export const CATEGORY_ICONS: Record<ActorCategory, string> = {
  restoration_operator: '🪸',
  tourism_dive: '🤿',
  government: '🏛',
  investor_funder: '💰',
  fisheries: '🐟',
  degradation_driver: '⚠️',
  insurance_finance: '🛡',
}

/** Short letter shown inside the SVG node circle (emoji unreliable in SVG). */
export const CATEGORY_ABBREV: Record<ActorCategory, string> = {
  restoration_operator: 'R',
  tourism_dive: 'T',
  government: 'G',
  investor_funder: '$',
  fisheries: 'F',
  degradation_driver: '!',
  insurance_finance: 'S',
}

/** Raw SVG inner markup for each category icon (24×24 viewBox, stroke-based). */
export const CATEGORY_ICON_PATHS: Record<ActorCategory, string> = {
  restoration_operator:
    '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>' +
    '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  tourism_dive:
    '<circle cx="12" cy="5" r="3"/>' +
    '<line x1="12" y1="22" x2="12" y2="8"/>' +
    '<path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  government:
    '<line x1="3" y1="22" x2="21" y2="22"/>' +
    '<line x1="6" y1="18" x2="6" y2="11"/>' +
    '<line x1="10" y1="18" x2="10" y2="11"/>' +
    '<line x1="14" y1="18" x2="14" y2="11"/>' +
    '<line x1="18" y1="18" x2="18" y2="11"/>' +
    '<polygon points="12 2 20 7 4 7"/>',
  investor_funder:
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>' +
    '<polyline points="16 7 22 7 22 13"/>',
  fisheries:
    '<ellipse cx="14" cy="12" rx="7" ry="5"/>' +
    '<polygon points="3,8 8,12 3,16"/>',
  degradation_driver:
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
    '<line x1="12" y1="9" x2="12" y2="13"/>' +
    '<line x1="12" y1="17" x2="12.01" y2="17"/>',
  insurance_finance:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
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
