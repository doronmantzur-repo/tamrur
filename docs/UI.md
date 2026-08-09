# UI Design System

## Library

**Mantine** — 120+ components, CSS Modules (no runtime styling overhead), built-in light/dark theming, responsive style props, official RTL support.

## Language / Direction

- Hebrew, RTL (`<html dir="rtl" lang="he">`)
- See `ARCHITECTURE.md` for RTL implementation notes (logical CSS properties, icon mirroring, etc.)

## Typography

- **Primary typeface: Heebo** (Google Fonts) — clean, high-contrast, well-spaced, built for modern Hebrew interfaces
- **Monospace fallback** for numeric/ID data (coordinates, callsigns, event IDs, timestamps) — use system mono stack (`ui-monospace, "SF Mono", "Consolas", monospace`), since Hebrew fonts aren't optimized for tabular numerals
- Weight scale: Regular (400) body text, Medium (500) labels/emphasis, Bold (700) headers

## Theme

- **Mode:** Light by default, with a dark mode toggle (Mantine's `MantineProvider` `colorScheme` + `useMantineColorScheme`)
- **Corners:** Rounded (Mantine default `radius="md"` as the app-wide default)
- **Borders:** Soft — light, low-contrast borders (`var(--mantine-color-gray-3)` in light mode) rather than heavy dividers
- **Hover feedback:** Highlighted — border/background color shift on hover (no shadow-lift, no scale transforms). Use Mantine's built-in hover states (`&:hover` background/border color tokens) rather than custom shadow effects.
- **Shadows:** Subtle drop shadows on elevated surfaces only — cards, modals, popovers, dropdown menus — to separate them from the page background. Use Mantine's shadow scale (`shadow="sm"` for cards, `shadow="md"` for modals/popovers) rather than custom box-shadow values, so light/dark mode contrast stays consistent automatically.
- **Glow effect:** Reserved for active/live states that need attention — e.g. an active event indicator, an incoming urgent casualty alert, or a "live" badge on the map. Implement as a soft `box-shadow` in the accent color (e.g. `0 0 8px rgba(25, 113, 194, 0.5)` for blue) rather than a generic white glow, so it reads as "this is active" rather than decoration. Use sparingly — if everything glows, nothing signals urgency.

### Color Palette (starting point — placeholder, revisit later)

| Role | Light mode | Dark mode | Usage |
|---|---|---|---|
| Primary / accent | `blue.6` (Mantine default blue) | `blue.4` | Primary buttons, active nav, links |
| Background | `gray.0` (near-white) | `dark.7` | App background |
| Surface (cards/panels) | `white` | `dark.6` | Panels, tables, dialogs |
| Border | `gray.3` | `dark.4` | Default borders |
| Text primary | `gray.9` | `gray.0` | Body text |
| Text secondary | `gray.6` | `gray.4` | Labels, muted text |

**Status/urgency colors** (for casualty triage — needs clinical sign-off, this is a placeholder):

| Status | Color |
|---|---|
| Critical / immediate evac | `red.6` |
| Urgent | `orange.6` |
| Delayed / stable | `yellow.6` |
| Minor / walking wounded | `green.6` |
| Unknown / unassessed | `gray.5` |

## Components (Mantine defaults to lean on)

- **Layout:** `AppShell` for the Brigade TOC dashboard frame (nav + header + main)
- **Data display:** `Table` for casualty/evac lists, `Badge` for status/urgency tags, `Card` for event/summary panels
- **Forms:** `TextInput`, `Select`, `MultiSelect` (evacuation method — multi-select per spec), `NumberInput`
- **Feedback:** `Notification` / `Modal` for confirmations (e.g. helicopter dispatch confirmation)
- **Navigation:** `Tabs` for role-specific views if a single user needs multiple sub-views

## Open Items

- Final color palette needs sign-off from the team — this is a working default
- Icon set not yet chosen (Mantine pairs well with `@tabler/icons-react` — verify RTL mirroring per-icon)
- Accessibility/contrast check needed once palette is finalized (especially status colors — colorblind-safe triage colors matter here)

## Maps

Map UI (Leaflet + OpenStreetMap) is specced separately in [`MAPS.md`](./MAPS.md) — covers provider choice, marker/layer behavior, and real-time update approach. Map markers reuse the status color palette defined above.
