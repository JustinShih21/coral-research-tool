import type { TeamSiteData } from '@/types/team'

export function getDefaultTeamSiteData(): TeamSiteData {
  return {
    teamOverview: {
      title: 'Meet the team',
      subtitle: 'Restore The Reefs',
      missionParagraphs: [
        'We are a multidisciplinary cohort focused on restoration finance, field partnerships, and transparent research outcomes.',
        'Together we connect capital, community, and science so reef restoration can scale with accountability.',
      ],
      goals: [
        'Advance bankable models for coral restoration in Indonesia',
        'Build trusted relationships with local stewards and partners',
        'Publish actionable insights for donors and policymakers',
      ],
      originStory:
        'Our team formed through USC Marshall coursework and field immersion, combining finance, operations, and marine conservation perspectives on a shared thesis — that restoration projects need clearer capital pathways to scale.',
    },
    currentMembers: [],
    pastCohorts: [],
  }
}
