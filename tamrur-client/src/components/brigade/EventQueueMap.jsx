// React
import { useEffect, useMemo, useState } from "react";

// External libraries
import { Box, Chip, Group, SimpleGrid, Stack, Text, useMantineColorScheme } from "@mantine/core";
import { IconAlertTriangle, IconUsers } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

// Internal application modules
import { COMPLETED_STATUS, EVENT_STATUS_COLOR_VARS, EVENT_STATUS_LABELS } from "../../constants/eventStatus";
import { FORCE_ICON_COLOR, FORCE_TYPE_META, FORCE_TYPE_ICONS, forceLabel } from "../../constants/forces";
import { buildDivIcon, tablerSvg } from "../../utils/leafletIcons";
import { toLatLng } from "../../utils/geo";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatDuration } from "../../utils/duration";
import { LegendEntry, LegendBadge } from "./MapLegendPrimitives";

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

/**
 * Builds an event marker: a warning-triangle glyph on a circle colored by
 * the event's status (same status-color mapping as the table's badges),
 * replacing the old plain colored dot so severity actually reads as a
 * warning rather than just a colored point. Completed events are shown
 * mixed toward the background instead of full opacity, so they visually
 * recede without needing a separate "dimmed" rendering path.
 *
 * @param {{ color: string, dimmed?: boolean }} options
 * @returns {L.DivIcon}
 */
function buildEventIcon({ color, dimmed = false }) {
  return buildDivIcon({
    label: tablerSvg(ALERT_TRIANGLE_PATHS, 14),
    background: dimmed ? `color-mix(in srgb, ${color} 55%, var(--app-color-background))` : color,
    size: 22,
    glow: !dimmed,
  });
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
 * @param {{ positions: Array<{ lat: number, lng: number }> }} props
 * @returns {null}
 */
function FitToMarkers({ positions }) {
  const map = useMap();

  useEffect(() => {
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
 * (one entry per event status) and a "כוחות" section (forces), each shown
 * only while its layer is actually toggled on — same convention as
 * EvacuationMap's own legend, so both maps read the same way.
 *
 * @param {{ isLayerOn: (key: string) => boolean }} props
 */
function MapLegend({ isLayerOn }) {
  const showEvents = isLayerOn("events");
  const showForces = isLayerOn("forces");

  if (!showEvents && !showForces) return null;

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
  const isCompleted = event.status === COMPLETED_STATUS;

  const [fallbackClosureAt] = useState(() => (isCompleted && !event.closure_at ? new Date().toISOString() : null));

  const elapsedSeconds = useElapsedSeconds(event.created_at, isCompleted ? event.closure_at || fallbackClosureAt : null);
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
 * @param {{ events: Array<object>, forces: Array<object>, casualtiesByEventId: Object<string, Array<object>> }} props
 * @returns {JSX.Element} The event queue map.
 */
const EventQueueMap = ({ events, forces, casualtiesByEventId = {} }) => {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();
  const [visibleLayers, setVisibleLayers] = useState(["events", "forces"]);

  const isLayerOn = (key) => visibleLayers.includes(key);

  const positioned = useMemo(
    () => events.map((event) => ({ event, latLng: toLatLng(event.location) })).filter((e) => e.latLng),
    [events],
  );
  const positions = useMemo(() => positioned.map((e) => e.latLng), [positioned]);
  const forcesWithCoords = useMemo(() => forces.filter((force) => force.location), [forces]);

  return (
    <Stack gap="xs" style={{ flex: 1, minHeight: 0 }}>
      <Group gap="xs" wrap="wrap" style={{ flexShrink: 0 }}>
        <Chip.Group multiple value={visibleLayers} onChange={setVisibleLayers}>
          <Chip value="events" size="xs">
            אירועים
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
              const isCompleted = event.status === COMPLETED_STATUS;

              return (
                <Marker
                  key={event.id}
                  position={latLng}
                  icon={buildEventIcon({ color, dimmed: isCompleted })}
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
      </Box>

      <Box style={{ flexShrink: 0, height: "12rem", overflow: "hidden" }}>
        <MapLegend isLayerOn={isLayerOn} />
      </Box>
    </Stack>
  );
};

export default EventQueueMap;
