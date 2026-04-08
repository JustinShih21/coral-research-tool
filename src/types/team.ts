export type TeamExperience = {
  title: string
  org: string
  description?: string
  start?: string
  end?: string
}

export type TeamEducation = {
  school: string
  degree?: string
  year?: string
}

export type TeamMember = {
  id: string
  slug: string
  name: string
  photoUrl: string
  linkedInUrl?: string
  headline?: string
  role?: string
  bio?: string
  experience: TeamExperience[]
  education: TeamEducation[]
  skills: string[]
}

export type PastCohortMember = {
  name: string
  photoUrl: string
  linkedInUrl: string
}

export type PastCohort = {
  id: string
  label: string
  members: PastCohortMember[]
}

export type TeamOverview = {
  title: string
  subtitle: string
  missionParagraphs: string[]
  goals: string[]
  originStory: string
}

export type TeamSiteData = {
  teamOverview: TeamOverview
  currentMembers: TeamMember[]
  pastCohorts: PastCohort[]
}
