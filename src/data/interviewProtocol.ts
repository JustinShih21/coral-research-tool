import type { ProtocolSection } from '@/types/research'

export const interviewProtocol: ProtocolSection[] = [
  {
    id: 'restoration',
    stakeholderType: 'Restoration Operators',
    questions: [
      { id: 'r1', text: 'How is your current funding structured across grants, government, private sector, and community sources? What share is multi-year?' },
      { id: 'r2', text: 'Which monitoring, reporting, and verification systems do you use, and what gaps prevent stronger funder confidence?' },
      { id: 'r3', text: 'Which reef beneficiaries currently contribute to your work, and which major beneficiaries do not contribute?' },
      { id: 'r4', text: 'What institutional mechanism (levy, fund, budget line, insurance linkage) would most improve long-term predictability?' },
      { id: 'r5', text: 'Where do coordination failures occur between implementers, regulators, and funders?' },
    ],
  },
  {
    id: 'tourism',
    stakeholderType: 'Tourism & Dive Industry',
    questions: [
      { id: 't1', text: 'How dependent is your business on reef condition, and how do you track the economic risk of reef decline?' },
      { id: 't2', text: 'Do you currently contribute to reef protection? If not, what prevents participation (trust, free-rider concerns, affordability)?' },
      { id: 't3', text: 'Would you support a mandatory conservation levy? Which governance body would you trust to manage it?' },
      { id: 't4', text: 'What would make reef financing feel like a normal operating cost instead of a discretionary donation?' },
      { id: 't5', text: 'How do short planning cycles in tourism operations affect willingness to support long-term reef recovery?' },
    ],
  },
  {
    id: 'government',
    stakeholderType: 'Government & Policy',
    questions: [
      { id: 'g1', text: 'Which institutions currently have authority over reef policy, enforcement, and budgeting in this region?' },
      { id: 'g2', text: 'What is the pathway for mandating tourism or user-based reef financing, and where does implementation break down?' },
      { id: 'g3', text: 'How does the Raja Ampat fee model inform policy options for Bali or other reef-dependent areas?' },
      { id: 'g4', text: 'What would be required to classify reef protection as coastal infrastructure or risk-reduction spending?' },
      { id: 'g5', text: 'Which constraints are most material: fiscal limits, fragmentation, enforcement capacity, or corruption risks?' },
    ],
  },
  {
    id: 'investors',
    stakeholderType: 'Investors & Funders',
    questions: [
      { id: 'i1', text: 'How do you evaluate reef projects given long ecological timelines and limited standardized benchmarks?' },
      { id: 'i2', text: 'What level of governance, verification, and enforcement is needed before you can commit multi-year capital?' },
      { id: 'i3', text: 'What specific structures (blended finance, outcomes contracts, guarantees) could make coral investment bankable?' },
      { id: 'i4', text: 'How do you compare coral opportunities to more mature financing pathways such as mangrove blue carbon?' },
      { id: 'i5', text: 'Where does your internal decision process fail to convert impact interest into committed funding?' },
    ],
  },
  {
    id: 'coastal_communities',
    stakeholderType: 'Coastal Communities & Fisheries',
    questions: [
      { id: 'c1', text: 'How dependent are household livelihoods on reef-linked fisheries or tourism?' },
      { id: 'c2', text: 'How have catches, reef quality, and income conditions changed in recent years?' },
      { id: 'c3', text: 'What environmental pressures are most visible locally (pollution, sedimentation, destructive fishing)?' },
      { id: 'c4', text: 'What support from government or NGOs has been useful, and what has been inconsistent?' },
      { id: 'c5', text: 'What prevents stronger participation in conservation when immediate income needs are high?' },
    ],
  },
  {
    id: 'degradation_drivers',
    stakeholderType: 'Degradation Drivers & Enforcement Interfaces',
    questions: [
      { id: 'd1', text: 'Which economic activities are currently driving degradation in this area, and who benefits from them?' },
      { id: 'd2', text: 'Which regulations exist to limit these impacts, and where is enforcement weakest?' },
      { id: 'd3', text: 'What incentives currently make harmful practices economically rational for operators?' },
      { id: 'd4', text: 'Which policy or market levers could shift these actors toward lower-impact behavior?' },
      { id: 'd5', text: 'Where are the highest-leverage intervention points for reducing degradation pressure quickly?' },
    ],
  },
  // Bali field questionnaire (from BUAD493 trip)
  {
    id: 'field_tourism',
    stakeholderType: 'Bali field — All tourism spots',
    questions: [
      { id: 'f1', text: 'What do you guys do in regard to coral restoration?' },
      { id: 'f2', text: 'How often do you monitor the coral?' },
      { id: 'f3', text: 'How long have you been operating for?' },
      { id: 'f4', text: "What's the size of your operation? (workforce, employee vs volunteer split)" },
      { id: 'f5', text: 'What are your funding sources? Which are most and least reliable? Alternative funding sources you\'re looking into?' },
      { id: 'f6', text: 'Who do you work with? (orgs, investors, donors, scientists) What\'s the composition of the workforce for your restoration programs?' },
      { id: 'f7', text: 'What would you consider the main draw for both investors and volunteers/employees?' },
      { id: 'f8', text: 'How do you engage tourists in coral restoration? How likely are they to engage?' },
      { id: 'f9', text: 'How do you engage locals in coral restoration? What would you consider an area for possible growth regarding engagement?' },
      { id: 'f10', text: 'Have you developed a way to quantify the value the coral brings? If so, how?' },
    ],
  },
  {
    id: 'field_living_seas',
    stakeholderType: 'Bali field — Living Seas',
    questions: [
      { id: 'fls1', text: 'What are the costs associated with replanting and maintaining the coral on a reef star?' },
    ],
  },
  {
    id: 'field_villages',
    stakeholderType: 'Bali field — Villages',
    questions: [
      { id: 'fv1', text: 'Funding from federal government — how much autonomy in allocating funds towards specific initiatives?' },
      { id: 'fv2', text: 'Typical day to day activities?' },
      { id: 'fv3', text: 'What are their views on the coral reef and what benefits it can bring them?' },
      { id: 'fv4', text: 'Have you noticed possible decreases in the fish population in the past couple of years? (Loss in aquatic biodiversity due to coral depletion?)' },
    ],
  },
  {
    id: 'field_eco_lodge',
    stakeholderType: 'Bali field — Eco Lodge',
    questions: [
      { id: 'fe1', text: 'Same themes as tourism: funding, engagement, reef dependency, quantification of value.' },
    ],
  },
  {
    id: 'field_ngos',
    stakeholderType: 'Bali field — Other NGOs',
    questions: [
      { id: 'fn1', text: 'Funding, partnerships, scaling, and barriers to institutional financing.' },
    ],
  },
]
