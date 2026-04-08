# Coral Research — Internal Research Tool

Internal tool for the Indonesia Coral Reef Restoration Finance Research project. Built from the PRD (Product Requirements Document).

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or use the existing `.env` if present).
2. In the [Supabase SQL Editor](https://supabase.com/dashboard), run `supabase-schema.sql` to create the `research_data` table (and profiles/trigger if you use that section).
3. For **team photo uploads** on `/team/manage`, run `team-photos-storage.sql` in the SQL Editor (same as the Storage block at the bottom of `supabase-schema.sql`).
4. Then:

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Notes and edits sync to Supabase so all users see the same data. If Supabase is not configured, data falls back to localStorage only.

## Build

```bash
npm run build
```

Output is in `dist/`.

## Features

- **Home** — Public-facing nonprofit landing page (new)
- **Donate** — Donation landing page with impact calculator (new)
- **Dashboard** — Research phases and key activities
- **Stakeholder Network** — Interactive D3 force-directed graph: filter by category, relationship type, interview status; path highlight between two nodes; click a node for detail panel and interview notes; export graph as JSON
- **Hypothesis Tracker** — H1–H4 with add/remove evidence (synced to Supabase)
- **Interview Protocol** — Question guides by stakeholder type with note fields (synced to Supabase)
- **Case Studies** — Louisiana wetlands, Wildfire, Mangroves
- **Bottleneck Diagnostic** — Severity scoring for five bottleneck types (synced to Supabase)

## Tech

- Vite, React 18, TypeScript
- D3 v7 (force simulation for stakeholder network)
- React Router
- Supabase (shared persistence for notes, hypotheses, interview notes, bottlenecks)
- Data and types aligned with the PRD graph schema and research framework

## Vercel deployment

Set environment variables in the Vercel project: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Ensure the `research_data` table exists in Supabase (run `supabase-schema.sql`).

Optional donation configuration:
- `VITE_DONATION_URL` — external donation processor URL (Stripe payment link, Givebutter, Donorbox, etc.); the app appends `amount` and `frequency` query params (existing query params on the URL are preserved).
- `VITE_DONATION_EMAIL` — fallback email address for pledge flow when `VITE_DONATION_URL` is not set.
- `VITE_DONATION_PROCESSOR_LABEL` — short name shown on `/donate` (e.g. `Stripe`) so donors know which checkout they are entering.
- `VITE_DONATION_SUPPORT_EMAIL` — optional; used in FAQ copy and the contact line. Defaults to `VITE_DONATION_EMAIL`.
