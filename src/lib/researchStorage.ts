import { supabase, isSupabaseConfigured } from './supabase'

const TABLE = 'research_data'

export async function getResearchData<T>(key: string): Promise<T | null> {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) {
      console.warn('[researchStorage] Supabase get failed, falling back to localStorage:', error.message)
      return getFromLocalStorage<T>(key)
    }
    if (data?.value != null) return data.value as T
    return null
  }
  return getFromLocalStorage<T>(key)
}

/** Returns true if saved to cloud (or Supabase not configured), false if only local or write failed. */
export async function setResearchData(key: string, value: unknown): Promise<boolean> {
  const payload = { key, value: value ?? {}, updated_at: new Date().toISOString() }
  setToLocalStorage(key, value)
  if (!isSupabaseConfigured() || !supabase) return true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'key' })
  if (error) {
    console.warn('[researchStorage] Supabase set failed, falling back to localStorage:', error.message)
    return false
  }
  return true
}

function getFromLocalStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function setToLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value ?? {}))
  } catch {
    // ignore
  }
}

export const RESEARCH_KEYS = [
  'coral-network-notes',
  'coral-hypotheses',
  'coral-interview-notes',
  'coral-bottlenecks',
] as const
