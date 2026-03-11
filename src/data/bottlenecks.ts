import type { BottleneckType } from '@/types/research'

export const bottleneckTypes: BottleneckType[] = [
  {
    id: 'actor_misalignment',
    name: 'Actor Misalignment',
    description: 'Beneficiaries, protectors, funders, and regulators sit in separate institutional systems with no reliable mechanism connecting value creation to payment obligations.',
    severity: 0,
    notes: '',
  },
  {
    id: 'institutional_fragmentation',
    name: 'Institutional Fragmentation',
    description: 'Overlapping governance systems (fisheries, MPA authorities, tourism, environment, coastal planning) create diffuse accountability and undefined financing responsibility.',
    severity: 0,
    notes: '',
  },
  {
    id: 'visibility_salience',
    name: 'Visibility and Salience Gap',
    description: 'Slow, underwater degradation receives less urgency than visible crises such as wildfire or floods, weakening political and philanthropic momentum.',
    severity: 0,
    notes: '',
  },
  {
    id: 'bootstrapping_problem',
    name: 'Institutional Bootstrapping Problem',
    description: 'MRV, governance, enforcement, and reporting systems need upfront funding, but those systems are prerequisites for credible financing.',
    severity: 0,
    notes: '',
  },
  {
    id: 'time_horizon_mismatch',
    name: 'Time-Horizon Mismatch',
    description: 'Ecological recovery takes decades while most decision cycles (political, ESG, investment) prioritize near-term outcomes.',
    severity: 0,
    notes: '',
  },
]
