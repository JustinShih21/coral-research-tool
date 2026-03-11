export interface LibraryDocument {
  id: string
  title: string
  description: string
  source: string
  topic?: string
  link?: string
}

export interface LibraryReading {
  id: string
  title: string
  topic: string
  source: string
  link?: string
}

export interface Contact {
  id: string
  name: string
  organization: string
  contact: string
  description: string
  category: 'in_person' | 'virtual'
}

export interface LibraryRecording {
  id: string
  title: string
  description: string
  type: 'video' | 'audio'
  source: string
  /** When set, show embedded player */
  link?: string
}
