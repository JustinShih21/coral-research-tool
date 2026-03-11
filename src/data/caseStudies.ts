import type { CaseStudy } from '@/types/research'

export const caseStudies: CaseStudy[] = [
  {
    id: 'louisiana',
    title: 'Louisiana Coastal Wetlands (CWPPRA)',
    summary: 'US federal program that classifies wetlands as storm protection infrastructure; federal engineering budget applies. Funding is institutionalized rather than voluntary.',
    relevance: 'Model for classifying reefs as coastal protection assets and routing public infrastructure budget to restoration.',
  },
  {
    id: 'wildfire',
    title: 'Wildfire / Forest Management',
    summary: 'Institutional mechanisms (insurance, land management budgets, utility liability) create obligatory spending on prevention and restoration.',
    relevance: 'Illustrates how insurance linkage and liability can create sustained funding flows for ecosystem management.',
  },
  {
    id: 'mangroves',
    title: 'Mangrove Blue Carbon',
    summary: 'Verified carbon credits issued for mangrove restoration; revenue funds ongoing maintenance. Standardized MRV and market access.',
    relevance: 'Closest analogue for coral blue carbon; highlights need for IPCC/Verra standard and clear cost-per-tonne frameworks.',
  },
]
