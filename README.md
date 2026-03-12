# Coral Research — Internal Research Tool

Internal tool for the Indonesia Coral Reef Restoration Finance Research project. Built from the PRD (Product Requirements Document).

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or use the existing `.env` if present).
2. In the [Supabase SQL Editor](https://supabase.com/dashboard), run the script in `supabase-schema.sql` to create the `research_data` table.
3. Then:

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
