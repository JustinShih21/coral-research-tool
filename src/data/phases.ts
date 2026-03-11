import type { Phase } from '@/types/research'

export const researchPhases: Phase[] = [
  {
    id: 1,
    name: 'Scope & Framework Development',
    timing: 'Pre-Field (Now)',
    keyActivities: [
      'Define mission and central thesis',
      'Set structural barrier framework',
      'Map four institutional actor systems',
      'Finalize interview and coding protocol',
    ],
  },
  {
    id: 2,
    name: 'Field Research — Indonesia',
    timing: '1 Week In-Country',
    keyActivities: [
      'Interview beneficiaries, protectors, regulators, and funders',
      'Document degradation drivers and enforcement constraints',
      'Validate where coordination failures occur',
    ],
  },
  {
    id: 3,
    name: 'Analysis & Synthesis',
    timing: 'Post-Field (Weeks 1–2)',
    keyActivities: [
      'Code interviews across five dimensions',
      'Score dominant financing bottlenecks',
      'Map structural failure points and leverage points',
      'Compare evidence against wetlands, wildfire, and mangroves',
    ],
  },
  {
    id: 4,
    name: 'Tool & Framework Output',
    timing: 'Post-Field (Weeks 2–4)',
    keyActivities: [
      'Deliver financing gap diagnostic and actor matrix',
      'Define realistic financing and governance options',
      'Produce final institutional framework report',
    ],
  },
]
