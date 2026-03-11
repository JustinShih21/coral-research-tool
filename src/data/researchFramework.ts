export const projectMission = [
  'This research investigates the institutional and economic conditions that determine whether ecosystems receive sustained financial support, using coral reefs in Indonesia as the primary case.',
  'Coral reefs generate major value through tourism, fisheries, coastal protection, and biodiversity, yet reef protection remains chronically underfunded relative to other environmental systems.',
  'The core objective is to identify why financing fails to stabilize and which institutional mechanisms could realistically support reef protection at scale.',
]

export const centralThesis =
  'Coral reefs are underfunded not because they lack value, but because institutions that connect beneficiaries, protectors, funders, and regulators are fragmented and difficult to bootstrap.'

export const structuralBarriers = [
  {
    id: 'institutional_fragmentation',
    name: 'Institutional Fragmentation',
    description:
      'Reefs are managed across fisheries, MPAs, tourism regulation, environmental ministries, and coastal development agencies without a unified governance architecture.',
    implications: [
      'Protection responsibilities are diffuse.',
      'Accountability is unclear.',
      'Financing mandates are undefined.',
    ],
  },
  {
    id: 'visibility_salience',
    name: 'Visibility and Salience Gap',
    description:
      'Reef degradation is underwater and gradual, so it receives less urgency than visible crises such as wildfire, floods, deforestation, or oil spills.',
    implications: [
      'Lower political urgency.',
      'Lower media and philanthropic attention.',
      'Lower corporate pressure to contribute.',
    ],
  },
  {
    id: 'bootstrapping_problem',
    name: 'Institutional Bootstrapping Problem',
    description:
      'Credible financing requires MRV, governance, enforcement, and reporting infrastructure, but these systems need upfront funding before large-scale finance exists.',
    implications: [
      'No finance -> no infrastructure.',
      'No infrastructure -> no investable environment.',
      'No investable environment -> no finance.',
    ],
  },
  {
    id: 'time_horizon_mismatch',
    name: 'Misaligned Investment Time Horizons',
    description:
      'Reef recovery often takes decades, while political cycles, ESG cycles, and investor windows are much shorter.',
    implications: [
      'Political cycles: roughly 2-5 years.',
      'Corporate ESG cycles: annual reporting.',
      'Investor horizons: often 5-10 years.',
    ],
  },
]

export const actorSystems = [
  {
    id: 'beneficiaries',
    name: 'System 1 - Reef Beneficiaries',
    description: 'Actors deriving direct economic value from reefs.',
    examples: [
      'Dive tourism operators and marine tour companies',
      'Coastal resorts and beach hotels',
      'Fisheries supply chains and seafood exporters',
      'Coastal real estate developers',
    ],
    evaluationFocus: [
      'Degree of dependency on reefs',
      'Current financial contribution to reef protection',
      'Realistic capacity to contribute',
    ],
  },
  {
    id: 'protection',
    name: 'System 2 - Reef Protection Actors',
    description: 'Actors implementing conservation and restoration activities.',
    examples: [
      'Coral restoration NGOs and marine conservation organizations',
      'Reef scientists and community monitoring groups',
      'Marine protected area authorities',
    ],
    evaluationFocus: [
      'Execution capacity',
      'Financial stability',
      'Operational constraints',
    ],
  },
  {
    id: 'governance',
    name: 'System 3 - Governance and Regulation',
    description: 'Actors setting policy, oversight, and enforcement conditions.',
    examples: [
      'Ministry of Marine Affairs and Fisheries',
      'Environmental ministries and local governments',
      'Marine park administrations and fisheries regulators',
    ],
    evaluationFocus: [
      'Policy authority and mandate scope',
      'Enforcement capability',
      'Fragmentation, resource, and corruption risks',
    ],
  },
  {
    id: 'degradation',
    name: 'System 4 - Reef Degradation Drivers',
    description: 'Actors and activities creating pressure on reef ecosystems.',
    examples: [
      'Industrial runoff and plastic waste flows',
      'Sediment runoff from land clearing',
      'Destructive fishing practices',
      'Tourism mismanagement and high-impact coastal development',
    ],
    evaluationFocus: [
      'Economic incentives behind harmful activity',
      'Policy gaps enabling continued degradation',
      'Intervention leverage points',
    ],
  },
]

export const fieldObjectives = [
  'Which actors benefit most economically from coral reefs?',
  'Which actors have financial capacity to support reef protection?',
  'Which institutions have governance authority over reefs?',
  'Which activities drive reef degradation?',
  'Where do institutional coordination failures occur?',
]

export const interviewDimensions = [
  {
    id: 'economic_dependency',
    name: 'Economic Dependency',
    prompt: 'How strongly does this actor depend on reef ecosystems for revenue or livelihoods?',
  },
  {
    id: 'financing_capacity',
    name: 'Financing Capacity',
    prompt: 'Can this actor contribute financially to protection in a realistic and sustained way?',
  },
  {
    id: 'governance_authority',
    name: 'Governance Authority',
    prompt: 'Does this actor have formal policy, oversight, or enforcement authority?',
  },
  {
    id: 'environmental_impact',
    name: 'Environmental Impact',
    prompt: 'Does this actor contribute to reef degradation or risk reduction?',
  },
  {
    id: 'institutional_constraints',
    name: 'Institutional Constraints',
    prompt: 'What barriers block action (funding gaps, weak enforcement, corruption, fragmentation)?',
  },
]

export const analyticalQuestions = [
  'Why do coral reef ecosystems remain institutionally underfunded despite economic value?',
  'Why do financial systems support reef-damaging activity more reliably than reef protection?',
  'Which institutional structures can connect reef beneficiaries to reef protection finance?',
  'Which governance mechanisms can support scalable reef restoration?',
]

export const expectedOutcomes = [
  'Explain why coral reef ecosystems struggle to attract durable financing.',
  'Identify where institutional coordination failures occur.',
  'Determine which actors could realistically finance reef protection.',
  'Outline governance structures that could support reef protection systems at scale.',
]

export const fieldInsightExample = {
  title: 'Example Field Insight - Muara Angke Fishing Community',
  observations: [
    'Fishing is a primary livelihood for a large share of households.',
    'Fishing knowledge is often transmitted across generations.',
    'Fish stocks are perceived as lower than in previous decades.',
    'Pollution and waste are viewed as major concerns.',
    'Government support is perceived as inconsistent.',
    'Immediate income pressures often override long-term conservation priorities.',
  ],
  interpretation:
    'Communities with high ecological dependency may have limited capacity to finance restoration directly, reinforcing the need for broader institutional financing mechanisms.',
}
