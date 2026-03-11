import type { ProtocolSection } from '@/types/research'

export const interviewProtocol: ProtocolSection[] = [
  {
    id: 'restoration',
    stakeholderType: 'Restoration Operators',
    questions: [
      { id: 'r1', text: 'How is your current funding structured (grants, corporate, government)? What share is multi-year vs project-based?' },
      { id: 'r2', text: 'What data do you report to funders (carbon, biodiversity, socioeconomic)? How standardized is it?' },
      { id: 'r3', text: 'Have you ever received funding from tourism operators or dive industry? If not, what would need to change?' },
      { id: 'r4', text: 'What institutional mechanism (fee, levy, budget line) would make reef funding stable and predictable?' },
    ],
  },
  {
    id: 'tourism',
    stakeholderType: 'Tourism & Dive Industry',
    questions: [
      { id: 't1', text: 'Do you see your business as dependent on reef health? How do you quantify that dependency?' },
      { id: 't2', text: 'Would you support a mandatory conservation levy on dive tourism? What would need to be true for you to pay voluntarily?' },
      { id: 't3', text: 'Are you aware of restoration efforts at sites you use? Do you contribute financially?' },
      { id: 't4', text: 'What would make reef funding feel like a normal cost of doing business rather than a donation?' },
    ],
  },
  {
    id: 'government',
    stakeholderType: 'Government & Policy',
    questions: [
      { id: 'g1', text: 'Has any Indonesian body classified reef protection as part of coastal infrastructure budget?' },
      { id: 'g2', text: 'What is the regulatory pathway for mandating a conservation levy on dive tourism—who has authority?' },
      { id: 'g3', text: 'How does the Raja Ampat model (entry/dive fees) compare to what could be done in Bali or elsewhere?' },
      { id: 'g4', text: 'What would it take for reefs to be treated as public infrastructure with dedicated budget lines?' },
    ],
  },
  {
    id: 'investors',
    stakeholderType: 'Investors & Funders',
    questions: [
      { id: 'i1', text: 'When you request carbon or impact data from restoration operators, how do you use it in decision-making?' },
      { id: 'i2', text: 'What would an outcome-based financing deal for coral restoration need to look like for you to participate?' },
      { id: 'i3', text: 'Is the person who receives impact data the same as the person who approves commitments? If not, how does information flow?' },
      { id: 'i4', text: 'How do you compare coral carbon or co-benefits to forest carbon or other nature-based solutions?' },
    ],
  },
]
