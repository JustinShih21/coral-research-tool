export interface LeonInsight {
  id: string
  title: string
  detail: string
  source: string
}

export interface InterviewQuestion {
  id: string
  text: string
  whyItMatters: string
}

export interface InterviewSection {
  id: string
  title: string
  questions: InterviewQuestion[]
}

export interface ToolConcept {
  id: string
  name: string
  stage: 'fast_mvp' | 'strategic_build'
  value: string
  build: string
  users: string[]
  coreInputs: string[]
  risks: string[]
}

export const leonProfile = {
  name: 'Leon Boey',
  org: 'Living Seas',
  role:
    'Founder/CEO focused on scaling coral restoration with stronger financing pathways in Bali and broader Asia.',
  orientation:
    'Business-oriented and impact-oriented. Investor conversations currently center on simple carbon metrics, but he is actively testing adjacent pathways.',
}

export const leonInsights: LeonInsight[] = [
  {
    id: 'carbon-demand',
    title: 'Investor asks are carbon-first',
    detail:
      'Corporate sponsors ask for carbon quantities and simple values, even when they do not deeply engage with methodology details.',
    source: 'Leon Boey Follow Up.docx',
  },
  {
    id: 'sink-source',
    title: 'Certification deadlock is structural',
    detail:
      'Coral credits face a sink-vs-source debate (alkalinity effects), and Verra currently has no coral methodology, creating a market-entry bottleneck.',
    source: 'Leon Boey Follow Up.docx',
  },
  {
    id: 'cost-competitiveness',
    title: 'Coral appears expensive on pure carbon pricing',
    detail:
      'Notes cite roughly 4.4-6.6 kg CO2 per m2 and an implied high per-kg cost versus forests, making reef projects harder to compare in carbon-only markets.',
    source: 'Leon Boey Follow Up.docx',
  },
  {
    id: 'timeline',
    title: 'Long-duration value is underpriced',
    detail:
      'Reef recovery and compounding ecological gains unfold over long horizons, while investor decisions usually reward short-cycle outcomes.',
    source: 'Leon Boey Follow Up.docx',
  },
  {
    id: 'field-mrv',
    title: 'Field monitoring is practical but not standardized',
    detail:
      'Living Seas methods are simple and replicable (regular measurement, photo documentation), but they do not yet map to accepted portfolio-level standards.',
    source: 'Leon Boey Follow Up.docx',
  },
  {
    id: 'segment-behavior',
    title: 'Different capital segments behave differently',
    detail:
      'Private investors respond to trust and narrative; corporates respond to tonnage framing; lenders want proof and repayment logic.',
    source: 'Leon Boey Follow Up.docx',
  },
]

export const operatingSignals: LeonInsight[] = [
  {
    id: 'livingseas-access',
    title: 'Living Seas offered field access and coral planting',
    detail:
      'Living Seas offered on-site interview and planting windows, showing operational openness for partner observation and co-learning.',
    source: 'BUAD493 Coral Restoration Bali Memo.docx',
  },
  {
    id: 'tourism-funding-link',
    title: 'Tourism-conservation linkage is central to Bali work',
    detail:
      'Bali was selected because restoration operations and tourism incentives are tightly coupled, enabling direct study of who benefits and who pays.',
    source: 'BUAD493 Coral Restoration Bali Memo.docx',
  },
  {
    id: 'collaboration-demand',
    title: 'Collaboration infrastructure is a recurring need',
    detail:
      'Post-trip plans repeatedly emphasize stakeholder matchmaking, shared training capacity, and neutral coordination infrastructure.',
    source: 'Coral Restoration plan post-trip.docx',
  },
]

export const interviewGoals = [
  'Clarify the exact financing bottleneck at Living Seas today (data, certifier pathway, investor process, or governance constraints).',
  'Test whether non-carbon value signals (biodiversity, fisheries, tourism resilience) can convert interest into commitments.',
  'Understand which tool or workflow would save Leon the most time in fundraising and partnership execution this quarter.',
  'Identify one near-term pilot that can be executed with existing data and partner relationships.',
]

export const interviewSections: InterviewSection[] = [
  {
    id: 'financing',
    title: 'Financing and Investor Conversion',
    questions: [
      {
        id: 'f1',
        text: 'In your recent pipeline, where exactly do prospective funders drop off after receiving your data?',
        whyItMatters: 'Pinpoints conversion failure step (top-of-funnel interest vs commitment bottleneck).',
      },
      {
        id: 'f2',
        text: 'Which three metrics are actually decision-critical for your best investors today?',
        whyItMatters: 'Separates vanity reporting from commit-driving metrics.',
      },
      {
        id: 'f3',
        text: 'What structure is most plausible in 12 months: sponsorship, debt, outcomes contract, or blended facility?',
        whyItMatters: 'Anchors tool design to realistic capital product, not abstract ideals.',
      },
      {
        id: 'f4',
        text: 'What evidence would a lender need to underwrite repayment confidence for a reef project?',
        whyItMatters: 'Defines data requirements for finance-grade reporting workflows.',
      },
    ],
  },
  {
    id: 'methodology',
    title: 'Methodology, MRV, and Standards',
    questions: [
      {
        id: 'm1',
        text: 'Which parts of your current monitoring workflow are robust, and which are weakest under due diligence?',
        whyItMatters: 'Shows where a tool should harden quality and auditability.',
      },
      {
        id: 'm2',
        text: 'How are you currently handling sink-vs-source objections in investor conversations?',
        whyItMatters: 'Reveals framing gaps and evidence needs for narrative tooling.',
      },
      {
        id: 'm3',
        text: 'If a certifier pathway does not open soon, what alternative proof frameworks are acceptable to your partners?',
        whyItMatters: 'Supports a pragmatic non-credit financing path.',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations and Scale Constraints',
    questions: [
      {
        id: 'o1',
        text: 'What are your largest operational constraints at current scale: labor, site quality, equipment, partner reliability, or governance?',
        whyItMatters: 'Targets practical system bottlenecks where software can help.',
      },
      {
        id: 'o2',
        text: 'Where do partnerships fail most often after initial enthusiasm?',
        whyItMatters: 'Guides design of collaboration and accountability features.',
      },
      {
        id: 'o3',
        text: 'Which recurring tasks are manual and repetitive enough to justify automation right now?',
        whyItMatters: 'Identifies high-ROI MVP scope.',
      },
    ],
  },
  {
    id: 'product',
    title: 'Tool Co-Design and Pilot Readiness',
    questions: [
      {
        id: 'p1',
        text: 'If we built one tool in the next 4-6 weeks, what specific workflow should it replace?',
        whyItMatters: 'Forces concrete product selection and deployment path.',
      },
      {
        id: 'p2',
        text: 'Which team members at Living Seas would own data entry, review, and external sharing?',
        whyItMatters: 'Prevents orphaned tools without operator accountability.',
      },
      {
        id: 'p3',
        text: 'What output format is most useful for your fundraising conversations: one-page brief, dashboard, or investor data room?',
        whyItMatters: 'Ensures tool outputs match real distribution channels.',
      },
    ],
  },
]

export const toolConcepts: ToolConcept[] = [
  {
    id: 'partner-matcher',
    name: 'Stakeholder Collaboration Matcher',
    stage: 'fast_mvp',
    value:
      'Matches NGOs, tourism operators, schools, and dive groups by capabilities, needs, and geography to accelerate credible partnerships.',
    build:
      'Profile intake + matching rules + shortlist generator + intro packet exporter (email-ready).',
    users: ['Living Seas partnerships team', 'NGOs', 'Eco-tourism operators'],
    coreInputs: ['Organization profile', 'Location', 'Resources offered', 'Resources needed'],
    risks: ['Needs active user onboarding', 'Low-quality profile data can create poor matches'],
  },
  {
    id: 'site-prioritizer',
    name: 'Restoration Site Prioritizer',
    stage: 'strategic_build',
    value:
      'Ranks candidate sites by ecological suitability and operational feasibility (depth, pollution risk, tourism pressure, access).',
    build:
      'Map UI + weighted scoring + layer overlays (reef health, runoff, traffic) + scenario comparison.',
    users: ['Field operations leads', 'Government or park partners'],
    coreInputs: ['Remote sensing layers', 'Local site observations', 'Travel/logistics constraints'],
    risks: ['Data availability varies by region', 'False precision risk without local validation'],
  },
  {
    id: 'investor-brief-builder',
    name: 'Investor Brief Builder',
    stage: 'fast_mvp',
    value:
      'Converts monitoring and impact notes into audience-specific briefs (corporate ESG, private impact investor, lender).',
    build:
      'Template engine + metric blocks + narrative blocks + export to PDF/slide-ready format.',
    users: ['Leon/fundraising leads', 'Program managers'],
    coreInputs: ['Project metrics', 'Monitoring summary', 'Partner outcomes', 'Funding ask'],
    risks: ['Garbage-in/garbage-out if data standards are weak', 'Needs disciplined update cadence'],
  },
  {
    id: 'mrv-workbench',
    name: 'Coral MRV Workbench',
    stage: 'strategic_build',
    value:
      'Standardizes repeated field measurements and evidence trails so projects are easier to compare and diligence-ready.',
    build:
      'Data schema + field entry workflow + evidence audit log + uncertainty annotations.',
    users: ['Science/monitoring team', 'External reviewers'],
    coreInputs: ['Site measurements', 'Photo/video evidence', 'Sampling protocols', 'Metadata'],
    risks: ['Requires protocol alignment upfront', 'Team adoption burden if workflow is too heavy'],
  },
]

export const leonSourceFiles = [
  {
    label: 'Leon Boey Follow Up',
    link: '/Coral Farming/Post Trip Research/Leon Boey Follow Up.docx',
  },
  {
    label: 'BUAD493 Coral Restoration Bali Memo',
    link: '/Coral Farming/Trip Notes/BUAD493 Coral Restoration Bali Memo.docx',
  },
  {
    label: 'Coral Restoration Plan Post-Trip',
    link: '/Coral Farming/Post Trip Research/Coral Restoration plan post-trip.docx',
  },
  {
    label: 'Interview Questions (Trip Notes)',
    link: '/Coral Farming/Trip Notes/Interviews/interview questions.docx',
  },
  {
    label: 'Living Seas Recording (Feb 2026)',
    link: '/Coral Farming/New 2026/LivingSeasLeonBoeyFeb3.mp4',
  },
]
