import type { Phase } from '@/types/research'

export const researchPhases: Phase[] = [
  {
    id: 1,
    name: 'Scope & Framework Development',
    timing: 'Pre-Field (Now)',
    keyActivities: ['Literature synthesis', 'Hypothesis formation', 'Stakeholder mapping', 'Interview guide design'],
  },
  {
    id: 2,
    name: 'Field Research — Indonesia',
    timing: '1 Week In-Country',
    keyActivities: ['Stakeholder interviews (restoration orgs, tourism operators)', 'Site observation', 'Funding flow documentation'],
  },
  {
    id: 3,
    name: 'Analysis & Synthesis',
    timing: 'Post-Field (Weeks 1–2)',
    keyActivities: ['Interview coding', 'Bottleneck analysis', 'Institutional gap mapping', 'Cross-case comparison'],
  },
  {
    id: 4,
    name: 'Tool & Framework Output',
    timing: 'Post-Field (Weeks 2–4)',
    keyActivities: ['Financing gap diagnostic', 'Stakeholder decision matrix', 'Final research report'],
  },
]
