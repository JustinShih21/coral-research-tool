-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor) to create the table.
-- This stores all research tool data (notes, hypotheses, interview notes, bottlenecks) so edits are shared across users.

create table if not exists research_data (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Allow anonymous read/write for the app (anon key). Adjust RLS if you add auth later.
alter table research_data enable row level security;

create policy "Allow anon read and write"
  on research_data
  for all
  to anon
  using (true)
  with check (true);
