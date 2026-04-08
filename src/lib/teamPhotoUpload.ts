import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export function getTeamPhotosBucket(): string {
  return (import.meta.env.VITE_TEAM_PHOTOS_BUCKET as string | undefined)?.trim() || 'team-photos'
}

export type UploadTeamPhotoResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string }

function safeFileExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName) && fromName.length <= 5) {
    return fromName
  }
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

/**
 * Uploads an image to the public Supabase Storage bucket (default name: team-photos).
 * Requires an authenticated session. Run the storage section in supabase-schema.sql first.
 */
export async function uploadTeamMemberPhoto(file: File, memberId: string): Promise<UploadTeamPhotoResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { ok: false, error: 'You must be logged in to upload photos.' }
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'Please choose an image file.' }
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, error: 'Use a JPEG, PNG, WebP, or GIF image.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Image must be 5 MB or smaller.' }
  }

  const bucket = getTeamPhotosBucket()
  const ext = safeFileExtension(file)
  const unique =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 12)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const path = `${memberId}/${Date.now()}-${unique}.${ext}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) {
    return {
      ok: false,
      error: uploadError.message.includes('Bucket not found')
        ? `Storage bucket "${bucket}" not found. Create it in Supabase and run the storage policies in supabase-schema.sql.`
        : uploadError.message,
    }
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!pub?.publicUrl) {
    return { ok: false, error: 'Upload succeeded but public URL was not returned.' }
  }

  return { ok: true, publicUrl: pub.publicUrl }
}
