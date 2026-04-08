export interface Phase {
  id: number
  name: string
  timing: string
  keyActivities: string[]
}

export interface Hypothesis {
  id: string
  title: string
  text: string
  evidence: HypothesisEvidence[]
}

export interface HypothesisEvidence {
  id: string
  quote: string
  source: string
  date: string
}

export interface CaseStudyImage {
  url: string
  alt: string
  credit?: string
}

export interface CaseStudySignal {
  id: string
  label: string
  value: number
  unit?: string
  note?: string
}

export interface CaseStudyScores {
  institutionalEmbedding: number
  damageVisibility: number
  financeMaturity: number
  reefTransferPotential: number
}

export interface CaseStudy {
  id: string
  title: string
  summary: string
  relevance: string
  fundingTrigger: string
  primaryPayer: string
  paybackHorizon: string
  scores: CaseStudyScores
  quantSignals: CaseStudySignal[]
  mechanismPoints: string[]
  accent: string
  image?: CaseStudyImage
}

export interface ProtocolSection {
  id: string
  stakeholderType: string
  questions: { id: string; text: string }[]
}
