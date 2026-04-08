-- =============================================================================
-- Team profile photos — run once in Supabase
-- =============================================================================
-- 1. Open https://supabase.com/dashboard → your project → SQL Editor
-- 2. New query → paste this entire file → Run
-- 3. Safe to re-run (policies are dropped and recreated; bucket is upserted)
--
-- Creates public bucket "team-photos" (5 MB max; JPEG, PNG, WebP, GIF only).
-- Your app uses this bucket when team members click "Upload image" on /team/manage.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-photos',
  'team-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read team photos" on storage.objects;
create policy "Public read team photos"
  on storage.objects for select
  using (bucket_id = 'team-photos');

drop policy if exists "Authenticated insert team photos" on storage.objects;
create policy "Authenticated insert team photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'team-photos');

drop policy if exists "Authenticated update team photos" on storage.objects;
create policy "Authenticated update team photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'team-photos')
  with check (bucket_id = 'team-photos');

drop policy if exists "Authenticated delete team photos" on storage.objects;
create policy "Authenticated delete team photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'team-photos');
