-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- research_data: shared research tool data (notes, hypotheses, interview notes).
-- Only authenticated users can write; everyone can read.

create table if not exists research_data (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table research_data enable row level security;

-- Remove old anon read+write policy if it exists (run once; ignore errors if already dropped).
drop policy if exists "Allow anon read and write" on research_data;

-- Anonymous: read-only (so the app is viewable without login).
create policy "Allow anon read"
  on research_data for select
  to anon
  using (true);

-- Authenticated: read and write (team members can save edits).
create policy "Allow authenticated read and write"
  on research_data for all
  to authenticated
  using (true)
  with check (true);

-- Optional: profiles for full_name (synced from auth.users.raw_user_meta_data).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Trigger to create profile on signup (full_name from metadata).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
