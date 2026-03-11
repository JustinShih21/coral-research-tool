import type { BottleneckType } from '@/types/research'

export const bottleneckTypes: BottleneckType[] = [
  {
    id: 'mrv',
    name: 'MRV & Standardization',
    description: 'No standardized measurement, reporting, and verification for coral restoration outcomes; high cost per tonne; lack of trust in data.',
    severity: 0,
    notes: '',
  },
  {
    id: 'investor_expectations',
    name: 'Investor Expectations',
    description: 'Investors request carbon/impact data but don\'t convert to commitment; unclear frameworks for evaluating coral data; no comparable OBF deals.',
    severity: 0,
    notes: '',
  },
  {
    id: 'free_rider',
    name: 'Free-Rider Dynamics',
    description: 'Beneficiaries (tourism, fisheries) benefit without contributing; no mechanism to internalize cost; collective action failure.',
    severity: 0,
    notes: '',
  },
  {
    id: 'institutional_absence',
    name: 'Institutional Absence',
    description: 'No reef fund, conservation fee, government budget line, or insurance linkage that makes funding obligatory.',
    severity: 0,
    notes: '',
  },
  {
    id: 'carbon_framing',
    name: 'Carbon Framing',
    description: 'Coral sequestration profile differs from forests; investors lack frameworks to act on coral carbon data; carbon narrative underperforms.',
    severity: 0,
    notes: '',
  },
]
