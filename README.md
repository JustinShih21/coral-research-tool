# Coral Research — Internal Research Tool

Internal tool for the Indonesia Coral Reef Restoration Finance Research project. Built from the PRD (Product Requirements Document).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`.

## Features

- **Dashboard** — Research phases and key activities
- **Stakeholder Network** — Interactive D3 force-directed graph: filter by category, relationship type, interview status; path highlight between two nodes; click a node for detail panel and interview notes; export graph as JSON
- **Funding Flows** — Table of current funding channels from the graph
- **Hypothesis Tracker** — H1–H4 with add/remove evidence (saved in browser)
- **Interview Protocol** — Question guides by stakeholder type with note fields (saved in browser)
- **Case Studies** — Louisiana wetlands, Wildfire, Mangroves
- **Bottleneck Diagnostic** — Severity scoring for five bottleneck types (saved in browser)

## Tech

- Vite, React 18, TypeScript
- D3 v7 (force simulation for stakeholder network)
- React Router
- Data and types aligned with the PRD graph schema and research framework
