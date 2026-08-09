# API Contract

Base path: `/api/v1`

## Conventions

- **Resource-based URLs**: plural nouns, no verbs in the path (`/events`, not `/create-event`)
- **HTTP methods carry the verb**: `POST` create, `GET` read, `PATCH` partial update, `PUT` full replace, `DELETE` remove
- **Auth**: JWT sent via `Authorization: Bearer <token>` header — never in the request body or query string
- **IDs in the path**, not the body: `/events/:eventId`, not `{ event-id }` in the payload
- **Naming**: `camelCase` for all JSON keys (fixes inconsistent `kebab-case` keys like `evac-urgency` in the original draft)
- **Nesting** reflects ownership: injuries and evacuations belong to an event, so they're nested under `/events/:eventId/...`
- **Response envelope** (consistent across all endpoints):
  ```json
  { "data": { ... }, "error": null }
  ```
  On failure:
  ```json
  { "data": null, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
  ```
- **Status codes**:
  | Code | Meaning |
  |---|---|
  | 200 | OK (read/update success) |
  | 201 | Created |
  | 204 | No Content (delete success) |
  | 400 | Malformed request |
  | 401 | Missing/invalid token |
  | 403 | Authenticated but not authorized for this role |
  | 404 | Resource not found |
  | 422 | Validation failed (well-formed but semantically invalid) |
  | 500 | Server error |
- **Pagination** on list endpoints: `?page=1&limit=20`, response includes `{ "data": [...], "meta": { "page", "limit", "total" } }`
- **Timestamps**: ISO 8601 (`createdAt`, `updatedAt`), UTC
- **Filtering**: query params, not custom endpoints (e.g. `/events/:eventId/injuries?status=ready`)

## Auth

### `POST /auth/signup`
**Req:** `{ brigade, password, role }`
**Res:** `201` → `{ data: { brigade, role, createdAt }, error: null }`

### `POST /auth/login`
**Req:** `{ brigade, role, password }`
**Res:** `200` → `{ data: { token, username, role }, error: null }`

## Events

### `POST /events`
**Auth:** Brigade TOC, Battalion TOC
**Req:** `{ eventType, location, status, time }`
**Res:** `201` → `{ data: { eventId, eventType, location, status, time, createdAt }, error: null }`

### `GET /events/:eventId`
**Res:** `200` → `{ data: { eventId, eventType, location, status, time }, error: null }`

### `PATCH /events/:eventId`
**Req:** `{ eventName?, status?, ... }` (partial update)
**Res:** `200` → `{ data: { eventId, ...updatedFields }, error: null }`

## Injuries (nested under event)

### `GET /events/:eventId/injuries`
**Query params:** `?status=&page=&limit=`
**Res:** `200` → `{ data: [{ injuryId, evacUrgency, evacPriority, escortNeeded, evacDest, evacAbility, evacReady }], meta: { page, limit, total }, error: null }`

### `POST /events/:eventId/injuries`
**Auth:** Medical ground force
**Req:** `{ evacUrgency, ... }`
**Res:** `201` → `{ data: { injuryId, evacUrgency, ... }, error: null }`

### `PATCH /events/:eventId/injuries/:injuryId`
**Req:** `{ evacPriority?, evacReady?, ... }`
**Res:** `200` → `{ data: { injuryId, ...updatedFields }, error: null }`

## Landing Pads

### `GET /landing-pads`
**Query params:** `?status=`
**Res:** `200` → `{ data: [{ padId, location, status, lastUpdated }], error: null }`

### `PATCH /landing-pads/:padId`
**Req:** `{ status }`
**Res:** `200` → `{ data: { padId, status, lastUpdated }, error: null }`

## Evacuations (nested under event)

### `POST /events/:eventId/evacuations`
**Auth:** Brigade TOC
**Req:** `{ evacMethod, evacDepPoint, evacDestPoint, evacRadioSign, evacStatus }`
**Res:** `201` → `{ data: { evacId, ... }, error: null }`

### `PATCH /events/:eventId/evacuations/:evacId`
**Req:** partial fields to update
**Res:** `200` → `{ data: { evacId, ...updatedFields }, error: null }`

## External

- LLM calls (Claude, RAG system) — decision support during the event + summary report generation on close. Recommend exposing this as `POST /events/:eventId/summary` (triggers generation) and `GET /events/:eventId/summary` (fetch result), rather than a raw passthrough to the LLM.

## Stretch / Extensions (not MVP)

- Electronic Warfare stakeholder endpoints (jamming notifications)
- Medical Corps stakeholder endpoints
- Google Maps API integration
- In-depth medical updates (101 form)
- Threat simulation

## Changes from original draft

- Moved all identifiers (`eventId`, `injuryId`, etc.) from the request body into the URL path
- Token moved from body to `Authorization` header
- Switched from action-style endpoints (`/create-event`, `/update-event`) to resource + HTTP verb (`POST /events`, `PATCH /events/:eventId`)
- Standardized `camelCase` keys (was a mix of `kebab-case` and inconsistent naming)
- Fixed the `/brigae/...` typo from the original spec by dropping the role from the path entirely — routes are resource-based, and access control is handled by role checks server-side, not by role-specific URLs
- Added a consistent response envelope and status-code table so frontend/backend don't have to negotiate error shape per-endpoint
- Added pagination and filtering conventions for list endpoints
