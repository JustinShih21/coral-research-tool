import { getResearchData, setResearchData } from '@/lib/researchStorage'
import { getDefaultTeamSiteData } from '@/data/teamDefaults'
import type {
  PastCohort,
  TeamMember,
  TeamOverview,
  TeamSiteData,
} from '@/types/team'

export const TEAM_DATA_KEY = 'coral-team-data' as const

function isTeamOverview(x: unknown): x is TeamOverview {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.title === 'string' &&
    typeof o.subtitle === 'string' &&
    Array.isArray(o.missionParagraphs) &&
    Array.isArray(o.goals) &&
    typeof o.originStory === 'string'
  )
}

function isTeamMember(x: unknown): x is TeamMember {
  if (!x || typeof x !== 'object') return false
  const m = x as Record<string, unknown>
  return (
    typeof m.id === 'string' &&
    typeof m.slug === 'string' &&
    typeof m.name === 'string' &&
    typeof m.photoUrl === 'string' &&
    Array.isArray(m.experience) &&
    Array.isArray(m.education) &&
    Array.isArray(m.skills)
  )
}

function isPastCohort(x: unknown): x is PastCohort {
  if (!x || typeof x !== 'object') return false
  const c = x as Record<string, unknown>
  return typeof c.id === 'string' && typeof c.label === 'string' && Array.isArray(c.members)
}

export function isValidTeamSiteData(x: unknown): x is TeamSiteData {
  if (!x || typeof x !== 'object') return false
  const d = x as Record<string, unknown>
  if (!isTeamOverview(d.teamOverview)) return false
  if (!Array.isArray(d.currentMembers) || !d.currentMembers.every(isTeamMember)) return false
  if (!Array.isArray(d.pastCohorts) || !d.pastCohorts.every(isPastCohort)) return false
  return true
}

function mergeOverview(raw: Partial<TeamOverview> | undefined, fallback: TeamOverview): TeamOverview {
  return {
    title: typeof raw?.title === 'string' ? raw.title : fallback.title,
    subtitle: typeof raw?.subtitle === 'string' ? raw.subtitle : fallback.subtitle,
    missionParagraphs: Array.isArray(raw?.missionParagraphs)
      ? raw.missionParagraphs.filter((p): p is string => typeof p === 'string')
      : fallback.missionParagraphs,
    goals: Array.isArray(raw?.goals)
      ? raw.goals.filter((g): g is string => typeof g === 'string')
      : fallback.goals,
    originStory: typeof raw?.originStory === 'string' ? raw.originStory : fallback.originStory,
  }
}

function normalizeMember(m: TeamMember): TeamMember {
  return {
    ...m,
    linkedInUrl: typeof m.linkedInUrl === 'string' ? m.linkedInUrl : '',
    headline: typeof m.headline === 'string' ? m.headline : '',
    role: typeof m.role === 'string' ? m.role : '',
    bio: typeof m.bio === 'string' ? m.bio : '',
    experience: Array.isArray(m.experience) ? m.experience : [],
    education: Array.isArray(m.education) ? m.education : [],
    skills: Array.isArray(m.skills) ? m.skills.filter((s): s is string => typeof s === 'string') : [],
  }
}

function mergeTeamData(partial: unknown): TeamSiteData {
  const base = getDefaultTeamSiteData()
  if (!partial || typeof partial !== 'object') return base
  const d = partial as Record<string, unknown>
  const overview = isTeamOverview(d.teamOverview)
    ? mergeOverview(d.teamOverview as TeamOverview, base.teamOverview)
    : base.teamOverview
  const currentMembers = Array.isArray(d.currentMembers)
    ? d.currentMembers.filter(isTeamMember).map(normalizeMember)
    : base.currentMembers
  const pastCohorts = Array.isArray(d.pastCohorts)
    ? d.pastCohorts.filter(isPastCohort).map((c) => ({
        ...c,
        members: Array.isArray(c.members)
          ? c.members.filter(
              (m): m is { name: string; photoUrl: string; linkedInUrl: string } =>
                m != null &&
                typeof m === 'object' &&
                typeof (m as { name?: string }).name === 'string' &&
                typeof (m as { photoUrl?: string }).photoUrl === 'string' &&
                typeof (m as { linkedInUrl?: string }).linkedInUrl === 'string'
            )
          : [],
      }))
    : base.pastCohorts
  return { teamOverview: overview, currentMembers, pastCohorts }
}

export async function loadTeamSiteData(): Promise<TeamSiteData> {
  const raw = await getResearchData<unknown>(TEAM_DATA_KEY)
  if (raw === null) return getDefaultTeamSiteData()
  return mergeTeamData(raw)
}

export async function saveTeamSiteData(data: TeamSiteData): Promise<boolean> {
  return setResearchData(TEAM_DATA_KEY, data)
}

export function slugFromName(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || 'member'
}

export function ensureUniqueSlug(slug: string, members: TeamMember[], exceptId?: string): string {
  const taken = new Set(members.filter((m) => m.id !== exceptId).map((m) => m.slug))
  if (!taken.has(slug)) return slug
  let n = 2
  let next = `${slug}-${n}`
  while (taken.has(next)) {
    n++
    next = `${slug}-${n}`
  }
  return next
}

export function newMemberId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function newCohortId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
