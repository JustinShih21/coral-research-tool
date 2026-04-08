import type { CaseStudy } from '@/types/research'
import { CASE_IMAGES } from '@/data/imageAssets'

export const caseStudies: CaseStudy[] = [
  {
    id: 'louisiana',
    title: 'Louisiana Coastal Wetlands (CWPPRA)',
    summary: 'Wetland restoration is financed through disaster mitigation and infrastructure budgets because wetlands are treated as storm-surge and flood protection assets with measurable avoided losses.',
    relevance: 'Shows how ecosystem protection scales when it is institutionalized as infrastructure protection, not positioned as optional philanthropy.',
    fundingTrigger: 'Avoided storm-loss framing tied to public infrastructure mandates.',
    primaryPayer: 'State and federal public budget channels',
    paybackHorizon: '5+ year budget and resilience planning cycles',
    scores: {
      institutionalEmbedding: 93,
      damageVisibility: 81,
      financeMaturity: 90,
      reefTransferPotential: 67,
    },
    quantSignals: [
      { id: 'la-1', label: 'Obligation Strength', value: 94, unit: '%' },
      { id: 'la-2', label: 'Budget Durability', value: 5, unit: '/5' },
      { id: 'la-3', label: 'Reef Fit Score', value: 67, unit: '/100' },
    ],
    mechanismPoints: [
      'Classifies ecosystem maintenance as infrastructure protection, not optional conservation.',
      'Links spending to visible and politically costly storm losses.',
      'Uses recurring public programs rather than short grant cycles.',
    ],
    accent: '#2E6B8A',
    image: CASE_IMAGES.louisiana,
  },
  {
    id: 'wildfire',
    title: 'Wildfire / Forest Management',
    summary: 'Wildfire prevention attracts large funding due to immediate, visible damage to homes and infrastructure; insurance systems and public safety budgets reinforce recurring spending.',
    relevance: 'Highlights the financing power of visibility and measurable loss; reef systems need clearer risk framing to trigger comparable budget and insurance responses.',
    fundingTrigger: 'Immediate asset-risk visibility and liability pressure.',
    primaryPayer: 'Insurance, utilities, and public safety budgets',
    paybackHorizon: 'Annual to 3-year risk-management cycles',
    scores: {
      institutionalEmbedding: 88,
      damageVisibility: 97,
      financeMaturity: 92,
      reefTransferPotential: 74,
    },
    quantSignals: [
      { id: 'wf-1', label: 'Damage Visibility', value: 97, unit: '/100' },
      { id: 'wf-2', label: 'Response Window', value: 24, unit: 'hrs' },
      { id: 'wf-3', label: 'Insurance Alignment', value: 89, unit: '%' },
    ],
    mechanismPoints: [
      'Makes consequences immediate and measurable for asset owners and policymakers.',
      'Creates direct cost exposure through insurance and liability pathways.',
      'Supports recurring prevention budgets because risk is continuously visible.',
    ],
    accent: '#C2410C',
    image: CASE_IMAGES.wildfire,
  },
  {
    id: 'mangroves',
    title: 'Mangrove Blue Carbon',
    summary: 'Mangroves entered climate finance through measurable and verifiable carbon methodologies, allowing credits to be issued and sold into established market infrastructure.',
    relevance: 'Demonstrates the role of standards and market plumbing; coral reefs currently lack an equally credible integration pathway and remain dependent on fragmented grants.',
    fundingTrigger: 'Standardized MRV + certifier-compatible carbon market integration.',
    primaryPayer: 'Carbon buyers, climate funds, and blended structures',
    paybackHorizon: '1-3 year issuance and crediting cycles',
    scores: {
      institutionalEmbedding: 84,
      damageVisibility: 72,
      financeMaturity: 86,
      reefTransferPotential: 81,
    },
    quantSignals: [
      { id: 'mg-1', label: 'Methodology Readiness', value: 86, unit: '/100' },
      { id: 'mg-2', label: 'Verification Cadence', value: 12, unit: 'mo' },
      { id: 'mg-3', label: 'Transfer Potential', value: 81, unit: '/100' },
    ],
    mechanismPoints: [
      'Builds investor confidence with standardized reporting and verification.',
      'Converts ecological outcomes into a tradable financial instrument.',
      'Uses existing climate-finance infrastructure to accelerate adoption.',
    ],
    accent: '#0B7A53',
    image: CASE_IMAGES.mangroves,
  },
]
