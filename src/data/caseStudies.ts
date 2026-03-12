import type { CaseStudy } from '@/types/research'
import { CASE_IMAGES } from '@/data/imageAssets'

export const caseStudies: CaseStudy[] = [
  {
    id: 'louisiana',
    title: 'Louisiana Coastal Wetlands (CWPPRA)',
    summary: 'Wetland restoration is financed through disaster mitigation and infrastructure budgets because wetlands are treated as storm-surge and flood protection assets with measurable avoided losses.',
    relevance: 'Shows how ecosystem protection scales when it is institutionalized as infrastructure protection, not positioned as optional philanthropy.',
    image: CASE_IMAGES.louisiana,
  },
  {
    id: 'wildfire',
    title: 'Wildfire / Forest Management',
    summary: 'Wildfire prevention attracts large funding due to immediate, visible damage to homes and infrastructure; insurance systems and public safety budgets reinforce recurring spending.',
    relevance: 'Highlights the financing power of visibility and measurable loss; reef systems need clearer risk framing to trigger comparable budget and insurance responses.',
    image: CASE_IMAGES.wildfire,
  },
  {
    id: 'mangroves',
    title: 'Mangrove Blue Carbon',
    summary: 'Mangroves entered climate finance through measurable and verifiable carbon methodologies, allowing credits to be issued and sold into established market infrastructure.',
    relevance: 'Demonstrates the role of standards and market plumbing; coral reefs currently lack an equally credible integration pathway and remain dependent on fragmented grants.',
    image: CASE_IMAGES.mangroves,
  },
]
