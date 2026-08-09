# Architecture

## User Roles & Permissions

All roles authenticate via login (`brigade` + `role` + `password`).

### Brigade TOC Officer
- Open a new event
- View full picture: casualty status, available evac forces/routes
- Assign/direct evac forces to the MCE location
- View event coordinates and neighboring helipads
- Request helicopter evac to a specific helipad
- Track ETA of evac vehicles/helicopters

### Medical Ground Force
- Open a new event
- Assign new injured soldiers to the event's casualty table
- Modify each casualty's properties (e.g. assign evacuation priority)

### Air Force Coordination Officer
- View event coordinates and neighboring helipads
- Dispatch a helicopter; track its location and ETA

### Superior Level ("רמה ממונה")
- View-only access to the Brigade TOC dashboard

## Core Entities (draft — see DB diagram for authoritative schema)

- **Event** — MCE instance: type, location, status, start/end time
- **Injury / Casualty** — id, evac urgency, evac priority, escort needed, evac destination, evac ability, evac-ready status
- **Landing Pad** — id, location, status, last-updated
- **Evacuation** — id, method (foot / ground vehicle / helicopter — multi-select), departure point, destination point, radio callsign, status
- **User** — brigade, role, credentials

## Data Flow (high level)

1. Battalion TOC / Medical ground force opens an event and logs casualties as they're identified.
2. Brigade TOC gets a live aggregated view (casualty counts, evac force + helipad availability).
3. Brigade TOC assigns evac method/routes and requests helicopters as needed.
4. Air Force dispatches and reports ETA; Electronic Warfare reports jamming status if relevant.
5. Hospital receives incoming-casualty data ahead of arrival.
6. On event close, the embedded LLM generates a summary report for Medical Corps.

## Screens

- Login
- Registration
- Open New Event
- Control Panel (Brigade TOC dashboard)
- Medical Interface
- Air Force Interface

## Localization / RTL

The entire application UI is in Hebrew and must render right-to-left.

- Set `<html dir="rtl" lang="he">` at the app root.
- Prefer CSS logical properties (`margin-inline-start`, `padding-inline-end`, etc.) over physical ones (`margin-left`/`margin-right`) so layout flips correctly.
- If using a component library (e.g. Mantine), enable its built-in RTL provider/mode rather than overriding styles manually.
- Icons/arrows that imply direction (back/forward, expand, chevrons) need mirroring in RTL — check each one, don't assume auto-mirroring.
- Form inputs, tables, and the graph/dashboard layouts should be tested specifically in RTL, not just translated — flex/grid direction and text alignment can silently stay LTR if not explicitly set.
- All static UI strings (labels, buttons, error messages) in Hebrew — keep them in a single strings/constants file rather than inline, so wording stays consistent across the team and is easy to adjust.
- Numbers, dates, and times: decide up front whether these display LTR-embedded-in-RTL (common convention) or follow document direction, and apply it consistently.

## Open Questions

- Database choice (SQL vs MongoDB) — not yet decided
- Real-time update mechanism (polling vs WebSockets) for live event state
- How the LLM/RAG integration is scoped for a 2-week MVP timeline
- Map integration: see [`MAPS.md`](./MAPS.md) for provider, layers, and open items
