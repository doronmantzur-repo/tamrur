# [Project Name TBD]

## Team

| Name | Role |
|---|---|
| Hagai Hamami | Product / Client Lead |
| Doron Mantzur | Server Lead |
| Tuval Zitelbach | Integration Lead |

## Product Description

During a mass casualty event (MCE) deep behind enemy lines, the Brigade Tactical Operations Center (TOC) faces a chaotic, rapidly changing mix of information — fluctuating wounded counts, active threats, and uncoordinated evacuation efforts.

This application constructs a real-time snapshot of an MCE, integrated within existing IDF command & control systems (משואה). It ingests:

- Wounded soldier data: count, injury type, treatment given, required evacuation type (ground vs. aerial, trauma center level, etc.)
- Geo-location: wounded soldiers, evacuation forces, helipads, ground/air exchange points
- Availability status: evacuation forces, landing pads, exchange points
- Active threats

An embedded LLM (Claude, RAG-based) supports decision-making during the event and generates a summary report once it ends.

## Target Users & Their Needs

- **Brigade TOC** — insert helipad data, start/manage events, choose evacuation method(s) and routes, select radio frequency, call evacuation forces
- **Battalion TOC** — define event location, hit type, regional risks; execute evacuation; land the helicopter
- **Medical team (ground)** — identify/tag injuries, track status and treatment, recommend evacuation method, assess event scale, track evacuation readiness per soldier
- **Air Force** — track ETA to helipad, callsign (או"ק), helicopter location
- **Electronic Warfare** — notify jamming start / in-progress / finished
- **Hospital** — track incoming injuries, status, treatment, evac method, ETA, bed readiness
- **Medical Corps (Operational Medicine Division)** — receive post-event detailed reports

## Tech Stack

- Frontend: React (Vite), Redux Toolkit
- Backend: Express, JWT auth
- Database: TBD (see `ARCHITECTURE.md`)
- AI: Claude (RAG) for decision support + post-event summaries
- Language: plain JavaScript (no TypeScript)
- UI language: Hebrew, right-to-left (RTL) — see `ARCHITECTURE.md` for implementation notes

## Setup

```bash
# TBD once repo structure is finalized
```

## Docs

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — roles, permissions, data flow, screens
- [`API_CONTRACT.md`](./API_CONTRACT.md) — endpoint list and payloads
- [`CONVENTIONS.md`](./CONVENTIONS.md) — git workflow, code style
- [`UI.md`](./UI.md) — design system: library, theme, typography, components
- [`MAPS.md`](./MAPS.md) — map provider, layers, real-time updates
