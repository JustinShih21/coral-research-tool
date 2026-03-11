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

export interface CaseStudy {
  id: string
  title: string
  summary: string
  relevance: string
}

export interface ProtocolSection {
  id: string
  stakeholderType: string
  questions: { id: string; text: string }[]
}

export interface BottleneckType {
  id: string
  name: string
  description: string
  severity: number
  notes: string
}
