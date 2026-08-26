// React
import { useEffect, useMemo, useRef, useState } from "react";

// External libraries
import { ActionIcon, Box, Chip, Group, SimpleGrid, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { IconAlertTriangle, IconAmbulance, IconListDetails, IconUsers, IconX } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Internal application modules
import { CLOSED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";
import {
  LANDING_PAD_STATUS_COLOR_VARS,
  LANDING_PAD_STATUS_LABELS,
} from "../../constants/evacuationMethod";
import { FORCE_ICON_COLOR, FORCE_TYPE_META, FORCE_TYPE_ICONS, forceLabel } from "../../constants/forces";
import { HOSPITAL_ICON, OTHER_LOCATION_ICON, buildLandingPadIcon, hospitalLabel } from "../../constants/locationMarkers";
import { buildDivIcon, tablerSvg } from "../../utils/leafletIcons";
import { splitLocationsByType, toLatLng } from "../../utils/geo";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";
import { LegendEntry, LegendBadge, StarOfDavidIcon } from "./MapLegendPrimitives";

// Styles
import "leaflet/dist/leaflet.css";

/** Stable reference for "no casualties fetched yet", so the selector fallback doesn't create a new array every render. */
const EMPTY_ARRAY = [];

/** CARTO basemap tiles, matching whichever mode the app is in — same family EvacuationMap uses. */
const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

/** Used only when there's nothing to show yet, so the map still has somewhere to sit. */
const FALLBACK_CENTER = { lat: 31.7683, lng: 35.2137 };
const FALLBACK_ZOOM = 11;

/** Raw path data for Tabler's alert-triangle glyph, used for the event marker. */
const ALERT_TRIANGLE_PATHS = [
  "M12 9v4",
  "M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0",
  "M12 16h.01",
];

/** `buildEventIcon`'s cache — see that function's comment for why this exists. */
const eventIconCache = new Map();

/**
 * Builds an event marker: a warning-triangle glyph on a circle colored by
 * the event's status (same status-color mapping as the table's badges),
 * replacing the old plain colored dot so severity actually reads as a
 * warning rather than just a colored point. Closed events are shown mixed
 * toward the background instead of full opacity, so they visually recede
 * without needing a separate "dimmed" rendering path.
 *
 * Cached by `color`+`dimmed` (the only two inputs that affect the output)
 * rather than built fresh every call: this is invoked inline in a `.map()`
 * on every render, and the page polls `fetchEvents()` every `POLL_INTERVAL_MS`
 * — each poll replaces the Redux `events` array (and every event object in
 * it) with new references even when nothing actually changed, which
 * re-triggers this render regardless. A freshly-built icon is a new object
 * every time, so react-leaflet's `Marker` sees a changed `icon` prop and
 * calls Leaflet's `setIcon()`, which tears down and rebuilds the marker's
 * DOM node — restarting the pulse animation from scratch on every poll
 * instead of letting it run continuously. Returning the same cached object
 * for the same status keeps the DOM node (and its animation) stable across
 * re-renders.
 *
 * @param {{ color: string, dimmed?: boolean }} options
 * @returns {L.DivIcon}
 */
function buildEventIcon({ color, dimmed = false }) {
  const cacheKey = `${color}|${dimmed}`;
  if (eventIconCache.has(cacheKey)) return eventIconCache.get(cacheKey);

  const icon = buildDivIcon({
    // 20px, not the original 14px — scaled up along with `size` below so the
    // glyph doesn't look lost inside the now-larger circle.
    label: tablerSvg(ALERT_TRIANGLE_PATHS, 20),
    background: dimmed ? `color-mix(in srgb, ${color} 55%, var(--app-color-background))` : color,
    // Deliberately larger than every other marker on this map (forces 24px,
    // hospitals/other-locations/landing-pads 26px) — was 22px before, the
    // *smallest* marker here despite being the whole point of the map.
    size: 34,
    glow: !dimmed,
    pulse: !dimmed,
  });
  eventIconCache.set(cacheKey, icon);
  return icon;
}

/** Opens a marker's popup on hover (not just click) and closes it when the pointer leaves, matching EvacuationMap's convention so force markers behave the same on every map. */
const OPEN_POPUP_ON_HOVER = {
  mouseover: (e) => e.target.openPopup(),
  mouseout: (e) => e.target.closePopup(),
};

/**
 * Recenters/fits the map whenever the set of visible event markers changes
 * (the date nav or search can both change it) — `MapContainer`'s own
 * `bounds` prop only applies once, on mount, so a plain prop change wouldn't
 * move the view on its own. Deliberately keyed only on event positions, not
 * forces — forces are spread along the entire border and would zoom the map
 * far out if included, defeating the point of fitting to "what's relevant
 * right now" (the events).
 *
 * `positions` is a new array reference every time the page's 5s event poll
 * resolves, even when the actual event data hasn't changed at all (Redux
 * replaces the array wholesale, and the `.filter()`/`.map()` chain feeding
 * this component always allocates fresh arrays) — so a plain reference-keyed
 * effect would reset the view out from under the user every few seconds,
 * regardless of whether they'd zoomed in. A content signature (rounded
 * lat/lng pairs, joined) lets the effect tell "actually different marker
 * set" apart from "same positions, new array," and only refits on the
 * former.
 *
 * @param {{ positions: Array<{ lat: number, lng: number }> }} props
 * @returns {null}
 */
function FitToMarkers({ positions }) {
  const map = useMap();
  const prevSignatureRef = useRef(null);

  useEffect(() => {
    const signature = positions.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
    if (signature === prevSignatureRef.current) return;
    prevSignatureRef.current = signature;

    if (positions.length === 0) {
      map.setView(FALLBACK_CENTER, FALLBACK_ZOOM);
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15 });
    }
  }, [positions, map]);

  return null;
}

/**
 * Legend explaining the map's symbols, grouped into an "אירועים" section
 * (one entry per event status), a "מיקומים" section (landing pads/
 * hospitals/other locations — same structure as EvacuationMap's own
 * legend, so a pad/hospital marker reads identically on both maps), and a
 * "כוחות" section (forces), each shown only while its layer is actually
 * toggled on.
 *
 * @param {{ isLayerOn: (key: string) => boolean }} props
 */
function MapLegend({ isLayerOn }) {
  const showEvents = isLayerOn("events");
  const showLocations = isLayerOn("pads") || isLayerOn("hospitals") || isLayerOn("other");
  const showForces = isLayerOn("forces");

  if (!showEvents && !showLocations && !showForces) return null;

  return (
    <Stack gap="xs" mt="xs">
      {showEvents && (
        <Stack gap={6}>
          <Text fz="xs" fw={700} c="var(--app-color-text-muted)">
            אירועים
          </Text>
          <SimpleGrid cols={3} spacing="sm" verticalSpacing={6}>
            {Object.entries(EVENT_STATUS_LABELS).map(([key, label]) => (
              <LegendEntry key={key} label={label}>
                <LegendBadge background={EVENT_STATUS_COLOR_VARS[key]}>
                  <IconAlertTriangle size={10} stroke={2} color="#fff" />
                </LegendBadge>
              </LegendEntry>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {showLocations && (
        <Stack gap={6}>
          <Text fz="xs" fw={700} c="var(--app-color-text-muted)">
            מיקומים
          </Text>
          <SimpleGrid cols={3} spacing="sm" verticalSpacing={6}>
            {isLayerOn("pads") &&
              Object.entries(LANDING_PAD_STATUS_LABELS).map(([key, label]) => (
                <LegendEntry key={key} label={`משטח נחיתה ${label}`}>
                  <LegendBadge background={LANDING_PAD_STATUS_COLOR_VARS[key]}>H</LegendBadge>
                </LegendEntry>
              ))}

            {isLayerOn("hospitals") && (
              <LegendEntry label="בית חולים">
                <StarOfDavidIcon size={16} stroke={1.8} color="var(--app-color-info)" />
              </LegendEntry>
            )}

            {isLayerOn("other") && (
              <LegendEntry label="נקודת חילוף / מיקום אחר">
                <IconAmbulance size={16} stroke={1.8} color="var(--app-color-text-muted)" />
              </LegendEntry>
            )}
          </SimpleGrid>
        </Stack>
      )}

      {showForces && (
        <Stack gap={6}>
          <Text fz="xs" fw={700} c="var(--app-color-text-muted)">
            כוחות
          </Text>
          <SimpleGrid cols={3} spacing="sm" verticalSpacing={6}>
            {Object.entries(FORCE_TYPE_META).map(([type, meta]) => (
              <LegendEntry key={type} label={meta.label}>
                <LegendBadge background={FORCE_ICON_COLOR}>
                  {meta.image ? (
                    <img
                      src={meta.image}
                      alt=""
                      style={{ width: "60%", height: "60%", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                    />
                  ) : (
                    <IconUsers size={10} stroke={2} color="#fff" />
                  )}
                </LegendBadge>
              </LegendEntry>
            ))}
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}

/**
 * Content for an event marker's popup: the event's name, its evacuated/total
 * casualty count, and a live elapsed-time-since-start timer -- same three
 * facts (minus the open/close actions) as the single-event dashboard's own
 * header, so glancing at a marker here tells you roughly what that page
 * would. Ticks every second like EventTimerChip; freezes at closure_at once
 * the event is completed, falling back to "now" (captured once) if a
 * completed event has no closure_at yet, so it doesn't tick forever.
 *
 * @param {{ event: object, casualties: Array<object> }} props
 */
function EventPopupContent({ event, casualties }) {
  const isClosed = event.status === CLOSED_STATUS;

  const [fallbackClosureAt] = useState(() => (isClosed && !event.closure_at ? new Date().toISOString() : null));

  const elapsedSeconds = useElapsedSeconds(event.created_at, isClosed ? event.closure_at || fallbackClosureAt : null);
  const evacuatedCount = casualties.filter((casualty) => casualty.is_evacuated).length;

  return (
    <Stack gap={2} align="center">
      <Text fz="xs" fw={700} ta="center">
        {event.name}
      </Text>
      <Text fz="xs" c="dimmed" ta="center">
        {`פונו ${evacuatedCount} מתוך ${casualties.length} נפגעים`}
      </Text>
      <Text fz="xs" c="dimmed" ta="center" ff='ui-monospace, "SF Mono", "Consolas", monospace'>
        {formatDuration(elapsedSeconds, { showDays: false })}
      </Text>
    </Stack>
  );
}

/**
 * A real Leaflet map of every event visible on the queue board's currently
 * selected date, alongside the table and (upcoming) kanban views — same map
 * primitive as the single-event dashboard's EvacuationMap (CARTO tiles
 * switching with the app's theme, div-icon markers), just plotting every
 * event at once instead of one event's location, plus the forces reference
 * layer (shared FORCE_TYPE_META/icons with EvacuationMap, so a force marker
 * looks the same on both maps). Both layers are toggleable via the same chip
 * pattern EvacuationMap uses. Event markers are a warning-triangle glyph
 * colored by status (matching the table's badges) rather than a plain dot;
 * clicking one opens that event's single-event dashboard, hovering opens a
 * popup (same open-on-hover convention as EvacuationMap) with the event's
 * name, evacuated/total casualties, and an elapsed-time timer -- forces'
 * popups are unchanged, still just their Hebrew label.
 *
 * @param {{ events: Array<object>, forces: Array<object>, locations: Array<object>, casualtiesByEventId: Object<string, Array<object>> }} props
 * @returns {JSX.Element} The event queue map.
 */
const EventQueueMap = ({ events, forces, locations, casualtiesByEventId = {} }) => {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const [visibleLayers, setVisibleLayers] = useState(["events", "forces", "pads", "hospitals", "other"]);
  const [legendOpen, setLegendOpen] = useState(true);

  const isLayerOn = (key) => visibleLayers.includes(key);

  const positioned = useMemo(
    () => events.map((event) => ({ event, latLng: toLatLng(event.location) })).filter((e) => e.latLng),
    [events],
  );
  const positions = useMemo(() => positioned.map((e) => e.latLng), [positioned]);
  const forcesWithCoords = useMemo(() => forces.filter((force) => force.location), [forces]);
  const { landingPads, hospitals, otherLocations } = useMemo(() => splitLocationsByType(locations), [locations]);

  return (
    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
      <Group gap="xs" wrap="wrap" style={{ flexShrink: 0 }}>
        <Chip.Group multiple value={visibleLayers} onChange={setVisibleLayers}>
          <Chip value="events" size="xs">
            אירועים
          </Chip>
          <Chip value="pads" size="xs">
            משטחי נחיתה
          </Chip>
          <Chip value="hospitals" size="xs">
            בתי חולים
          </Chip>
          <Chip value="other" size="xs">
            מיקומים נוספים
          </Chip>
          <Chip value="forces" size="xs">
            כוחות
          </Chip>
        </Chip.Group>
      </Group>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: "var(--mantine-radius-sm)",
          border: "1px solid var(--app-color-border)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <MapContainer center={FALLBACK_CENTER} zoom={FALLBACK_ZOOM} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={colorScheme === "dark" ? TILE_URLS.dark : TILE_URLS.light}
          />

          <FitToMarkers positions={positions} />

          {isLayerOn("events") &&
            positioned.map(({ event, latLng }) => {
              const color = EVENT_STATUS_COLOR_VARS[event.status] || "var(--app-color-text-muted)";
              const isClosed = event.status === CLOSED_STATUS;

              return (
                <Marker
                  key={event.id}
                  position={latLng}
                  icon={buildEventIcon({ color, dimmed: isClosed })}
                  zIndexOffset={1000}
                  eventHandlers={{
                    click: () => navigate(`/brigade/${event.id}`),
                    ...OPEN_POPUP_ON_HOVER,
                  }}
                >
                  <Popup>
                    <EventPopupContent event={event} casualties={casualtiesByEventId[event.id] || EMPTY_ARRAY} />
                  </Popup>
                </Marker>
              );
            })}

          {isLayerOn("pads") &&
            landingPads.map((pad) => {
              const padStatus = pad.is_ok ? "available" : "occupied";
              return (
                <Marker
                  key={pad.id}
                  position={toLatLng(pad.location)}
                  icon={buildLandingPadIcon(padStatus)}
                  eventHandlers={OPEN_POPUP_ON_HOVER}
                >
                  <Popup>
                    {pad.name}, {LANDING_PAD_STATUS_LABELS[padStatus]}
                  </Popup>
                </Marker>
              );
            })}

          {isLayerOn("hospitals") &&
            hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                position={toLatLng(hospital.location)}
                icon={HOSPITAL_ICON}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{hospitalLabel(hospital.name)}</Popup>
              </Marker>
            ))}

          {isLayerOn("other") &&
            otherLocations.map((location) => (
              <Marker
                key={location.id}
                position={toLatLng(location.location)}
                icon={OTHER_LOCATION_ICON}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{location.name}</Popup>
              </Marker>
            ))}

          {isLayerOn("forces") &&
            forcesWithCoords.map((force) => (
              <Marker
                key={force.id}
                position={toLatLng(force.location)}
                icon={FORCE_TYPE_ICONS[force.type]}
                eventHandlers={OPEN_POPUP_ON_HOVER}
              >
                <Popup>{forceLabel(force)}</Popup>
              </Marker>
            ))}
        </MapContainer>

        <ActionIcon
          variant="filled"
          size="lg"
          onClick={() => setLegendOpen((open) => !open)}
          aria-label={legendOpen ? "הסתר מקרא" : "הצג מקרא"}
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            zIndex: 1000,
            backgroundColor: "var(--app-color-surface)",
            color: "var(--app-color-text)",
            border: "1px solid var(--app-color-border)",
          }}
        >
          {legendOpen ? <IconX size={16} /> : <IconListDetails size={16} />}
        </ActionIcon>

        {legendOpen && (
          <Box
            style={{
              position: "absolute",
              left: 12,
              bottom: 56,
              zIndex: 1000,
              maxHeight: "70%",
              maxWidth: "min(20rem, 80%)",
              overflowY: "auto",
              backgroundColor: "var(--app-color-surface)",
              border: "1px solid var(--app-color-border)",
              borderRadius: "var(--mantine-radius-sm)",
              boxShadow: "var(--mantine-shadow-md)",
              padding: "0.5rem 0.75rem",
            }}
          >
            <MapLegend isLayerOn={isLayerOn} />
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default EventQueueMap;
